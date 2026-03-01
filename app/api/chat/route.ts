import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { getVectorStore } from '@/utils/rag'
import { getApiKeyWithFallback, isSecureStorageInitialized } from '@/utils/secureStorage'

// Polyfill for DOMMatrix in server environment
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
    a: number; b: number; c: number; d: number; e: number; f: number;
  } as any;
}

// Polyfill for ImageData in server environment
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor() {}
  } as any;
}

// Polyfill for Path2D in server environment
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {
    constructor() {}
  } as any;
}

// Get API key with multiple fallback strategies
function getApiKey(): string | null {
  // Priority 1: Environment variable (for production deployment)
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.length > 10) {
    console.log('Using API key from environment variable');
    return envKey;
  }

  // Priority 2: Secure storage (for encrypted local/secure deployment)
  if (isSecureStorageInitialized()) {
    const masterPassword = process.env.MASTER_PASSWORD;
    if (masterPassword) {
      const storedKey = getApiKeyWithFallback(masterPassword);
      if (storedKey) {
        console.log('Using API key from secure storage');
        return storedKey;
      }
    }
  }

  console.warn('No valid API key found in environment or secure storage');
  return null;
}

// Simple In-Memory Rate Limiter
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const LIMIT = 10;
const WINDOW_MS = 60 * 1000;

// Conversation history storage (in-memory) - In production, use Redis
interface ConversationMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

const conversationStore = new Map<string, ConversationMessage[]>();
const MAX_HISTORY = 10; // Keep last 10 messages

// Dữ liệu tuyển sinh mẫu (Context cơ bản cho AI)
const TUYEN_SINH_CONTEXT = `
BẠN LÀ TRỢ LÝ AI TƯ VẤN TUYỂN SINH CỦA CÔNG AN TỈNH CAO BẰNG - PHÒNG TỔ CHỨC CÁN BỘ.

THÔNG TIN TUYỂN SINH NĂM 2026:

1. ĐIỀU KIỆN DỰ TUYỂN:
- Bám sát quy định của Bộ Công an và Hướng dẫn của Công an tỉnh Cao Bằng.
- Độ tuổi: Từ 18 đến 22 tuổi (tính đến năm dự tuyển). Cán bộ, chiến sĩ nghĩa vụ hoặc xuất ngũ có thể cao hơn.
- Tốt nghiệp THPT hoặc tương đương.
- Thường trú tại tỉnh Cao Bằng hoặc theo quy định phân vùng tuyển sinh.
- Tiêu chuẩn chính trị, sức khỏe khắt khe theo quy định riêng của ngành. Chiều cao: Nam >= 1.64m, Nữ >= 1.58m (trừ một số dân tộc thiểu số áp dụng tiêu chuẩn thấp hơn đôi chút).

2. CÁC TRƯỜNG ĐÀO TẠO VÀ CHỈ TIÊU:
- Các trường ĐH, HV CAND: Học viện ANND, Học viện CSND, ĐH PCCC, ĐH Kỹ thuật - Hậu cần CAND...
- Chỉ tiêu: Được phân bổ cụ thể theo từng năm, từng đối tượng nam/nữ, dân tộc.

3. HẠN NỘP HỒ SƠ:
- Vui lòng theo dõi thông báo mới nhất trên cổng thông tin hoặc tại trụ sở Công an các huyện/thành phố, Công an xã nơi cư trú để biết hạn nộp hồ sơ đăng ký sơ tuyển trực tiếp.

4. CHẾ ĐỘ:
- Học phí: Miễn phí hoàn toàn.
- Chế độ đãi ngộ: Được bao ăn, ở, mặc; được hưởng phụ cấp sinh hoạt, BHYT.
- Sau tốt nghiệp: Công an tỉnh Cao Bằng hoặc Bộ Công an sẽ phân công công tác dựa trên kết quả học tập và nhu cầu thực tế.

9. LIÊN HỆ:
- Đơn vị: Phòng Tổ chức cán bộ - Công an tỉnh Cao Bằng.
- Các thí sinh cần đến trực tiếp Công an xã/phường/thị trấn hoặc Công an huyện/thành phố nơi cư trú để được hướng dẫn chi tiết sơ tuyển.

10. NGHỀ NGHIỆP SAU TỐT NGHIỆP:
- Được bố trí công tác tại các đơn vị thuộc lực lượng Công an nhân dân
- Hưởng lương và phụ cấp theo quy định
- Có cơ hội thăng tiến trong ngành
- Được đào tạo nâng cao chuyên môn nghiệp vụ

HƯỚNG DẪN TRẢ LỜI:
- Luôn lịch sự, thân thiện và chuyên nghiệp
- Trả lời ngắn gọn, súc tích, dễ hiểu
- Nếu không biết thông tin, hãy khuyên họ liên hệ hotline
- Khuyến khích thí sinh đăng ký sớm
- Luôn trả lời bằng tiếng Việt
- NHỚ NGỮ CẢNH: Khi người dùng hỏi tiếp theo, hãy nhớ và tham chiếu đến câu hỏi/câu trả lời trước đó để trả lời chính xác
- Ví dụ: Nếu người dùng hỏi "cách tính điểm năm 2026" rồi hỏi tiếp "còn năm 2025 thì sao", hãy hiểu là họ đang so sánh cách tính điểm giữa 2 năm
- Nếu người dùng nói "năm nay" thì hiểu là năm 2026, "năm sau" là 2027, "năm trước" là 2025
- KHÔNG DÙNG LATEX: Không dùng $$ hay $ để viết công thức toán học. Viết công thức bằng text thuần túy, dễ đọc.
- Ví dụ cách viết công thức: "ĐXT = (M1+M2+M3) x 2/5 + BTBCA x 3/5 + Điểm ưu tiên" thay vì dùng $$\n- Dùng bullet points (-) và số thứ tự (1., 2., 3.) để trình bày rõ ràng
- Bôi đậm các từ khóa quan trọng bằng cách để trong **dấu sao**
- Dùng emoji phù hợp để minh họa: 📌 cho thông tin quan trọng, ✅ cho điều kiện, 💡 cho lưu ý, 🎯 cho mục tiêu
`

// Helper functions for conversation history
function getConversationHistory(sessionId: string) {
  return conversationStore.get(sessionId) || [];
}

function addToHistory(sessionId: string, role: 'user' | 'model', content: string) {
  const history = getConversationHistory(sessionId);
  history.push({
    role,
    content,
    timestamp: Date.now(),
  });
  
  // Keep only last MAX_HISTORY messages
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
  
  conversationStore.set(sessionId, history);
}

function buildConversationContext(history: any[]) {
  if (history.length === 0) return '';
  
  let context = '\n\nLỊCH SỬ CUỘC TRÒ CHUYỆN GẦN ĐÂY:\n';
  history.forEach((msg, index) => {
    const prefix = msg.role === 'user' ? 'Thí sinh' : 'Trợ lý AI';
    context += `[${index + 1}] ${prefix}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`;
  });
  context += '\nHãy dựa vào lịch sử trên để trả lời câu hỏi tiếp theo một cách liên tục và chính xác.\n';
  
  return context;
}

export async function POST(req: NextRequest) {
  try {
    // Basic IP tracking for Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const userStatus = rateLimitMap.get(ip);

    if (userStatus && now < userStatus.resetTime) {
      if (userStatus.count >= LIMIT) {
        return NextResponse.json({ 
          response: 'Bạn đã hỏi quá nhanh. Vui lòng đợi 1 phút để tiếp tục trò chuyện!',
          sessionId: null 
        }, { status: 429 });
      }
      userStatus.count += 1;
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    }

    const { message, sessionId: clientSessionId } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Thiếu nội dung tin nhắn' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        response: 'Lỗi: Hệ thống chưa có API Key.',
        sessionId: null
      }, { status: 200 })
    }

    // Get or create session ID
    const sessionId = clientSessionId || `session_${ip}_${Date.now()}`;
    
    // Get conversation history
    const history = getConversationHistory(sessionId);
    
    // Add user message to history
    addToHistory(sessionId, 'user', message);

    // 1. Search knowledge base for relevant context
    let ragContext = '';
    try {
      const store = getVectorStore(apiKey);
      const searchResults = await store.search(message, 3);
      
      if (searchResults.length > 0) {
        ragContext = '\n\nTHÔNG TIN CHI TIẾT TỪ TÀI LIỆU:\n' + 
          searchResults.map((r, i) => 
            `[${i + 1}] Từ ${r.chunk.type === 'image' ? 'hình ảnh' : 'tài liệu'} "${r.chunk.metadata.filename}":\n${r.chunk.content.substring(0, 500)}...`
          ).join('\n\n');
      }
    } catch (error) {
      console.error('Lỗi tìm kiếm RAG:', error);
    }

    // 2. Build conversation context from history
    const conversationContext = buildConversationContext(history);

    // 3. Khởi tạo Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest"
    });

    // 4. Build complete prompt with all context
    const prompt = `${TUYEN_SINH_CONTEXT}${ragContext}${conversationContext}\n\nCâu hỏi hiện tại của thí sinh: ${message}\n\nHãy trả lời dựa trên toàn bộ ngữ cảnh trên. Nếu câu hỏi liên quan đến câu hỏi trước, hãy nhắc lại thông tin đã nói và bổ sung thêm. Trả lời bằng tiếng Việt:`;

    // 5. Generate response
    const result = await model.generateContent(prompt);
    const aiResponse = await result.response;
    const text = aiResponse.text();

    // 6. Add AI response to history
    addToHistory(sessionId, 'model', text);

    return NextResponse.json({ 
      response: text,
      sessionId: sessionId 
    });

  } catch (error: any) {
    console.error('Lỗi chi tiết:', error);

    // Trả về thông báo thân thiện cho người dùng thay vì crash
    return NextResponse.json({
      response: 'Xin lỗi, hệ thống đang bận hoặc có lỗi kết nối API. Bạn vui lòng thử lại sau giây lát.',
      sessionId: null
    }, { status: 200 });
  }
}