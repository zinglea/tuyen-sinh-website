import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel serverless function timeout (seconds)
export const maxDuration = 30;

// Rate Limiter
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const LIMIT = 10;
const WINDOW_MS = 60 * 1000;

// Conversation history (in-memory)
const conversationStore = new Map<string, { role: string, content: string }[]>();
const MAX_HISTORY = 10;

const SYSTEM_PROMPT = `
BẠN LÀ TRỢ LÝ AI TƯ VẤN TUYỂN SINH CỦA CÔNG AN TỈNH CAO BẰNG - PHÒNG TỔ CHỨC CÁN BỘ.

QUY TẮC TRẢ LỜI:
- Lịch sự, thân thiện, chuyên nghiệp
- Trả lời ngắn gọn, súc tích, dễ hiểu
- Luôn trả lời bằng tiếng Việt
- KHÔNG dùng LaTeX ($$ hay $), viết công thức bằng text thuần 
  Ví dụ: "ĐXT = (M1+M2+M3) x 2/5 + BTBCA x 3/5 + ĐC"
- Dùng bullet points (-) và số thứ tự (1., 2., 3.) rõ ràng
- Bôi đậm từ khóa quan trọng bằng **dấu sao**
- Dùng emoji: 📌 thông tin quan trọng, ✅ điều kiện, 💡 lưu ý, 🎯 mục tiêu
- Nếu không biết thông tin, khuyên liên hệ Phòng TCCB - Công an tỉnh Cao Bằng
- NHỚ NGỮ CẢNH: tham chiếu câu hỏi/trả lời trước đó
- "năm nay" = 2026, "năm trước" = 2025
`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const userStatus = rateLimitMap.get(ip);

    if (userStatus && now < userStatus.resetTime) {
      if (userStatus.count >= LIMIT) {
        return NextResponse.json({
          response: 'Bạn đã hỏi quá nhanh. Vui lòng đợi 1 phút!',
          sessionId: null
        }, { status: 429 });
      }
      userStatus.count += 1;
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    }

    const { message, sessionId: clientSessionId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Thiếu nội dung tin nhắn' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        response: 'Lỗi: Hệ thống chưa có API Key. Vui lòng cấu hình GEMINI_API_KEY.',
        sessionId: null
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return NextResponse.json({
        response: 'Lỗi: Hệ thống chưa cấu hình Database. Vui lòng liên hệ Admin.',
        sessionId: null
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const genAI = new GoogleGenerativeAI(apiKey);

    const sessionId = clientSessionId || `session_${ip}_${Date.now()}`;

    // Get conversation history
    const history = conversationStore.get(sessionId) || [];
    history.push({ role: 'user', content: message });
    if (history.length > MAX_HISTORY) history.shift();
    conversationStore.set(sessionId, history);

    // Build conversation context
    let conversationContext = '';
    if (history.length > 1) {
      conversationContext = '\n\nLỊCH SỬ TRÒ CHUYỆN:\n' +
        history.slice(0, -1).map((msg) =>
          `${msg.role === 'user' ? 'Thí sinh' : 'AI'}: ${msg.content.substring(0, 200)}`
        ).join('\n') + '\n';
    }

    // --- VECTOR SEARCH (RAG) ---
    console.log(`[Chat] Generating embedding for query...`);
    // 1. Nhúng (Embed) câu hỏi của user
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embedResult = await embeddingModel.embedContent(message);
    const queryVector = embedResult.embedding.values;

    // 2. Tìm kiếm trong Supabase sử dụng RPC match_documents
    console.log(`[Chat] Querying Supabase vector database...`);
    const { data: matchedDocs, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_threshold: 0.5, // Ngưỡng độ chính xác (0.0 đến 1.0)
      match_count: 8        // Lấy 8 đoạn văn bản gần nhất
    });

    if (matchError) {
      console.error("Supabase match_documents error:", matchError);
    }

    // 3. Xây dựng Context từ tài liệu tìm được
    let knowledgeContext = '';
    if (matchedDocs && matchedDocs.length > 0) {
      const docsContent = matchedDocs.map((doc: any, index: number) => `[Tài Liệu ${index + 1}]:\n${doc.content}`).join('\n\n');
      knowledgeContext = `\n\nDƯỚI ĐÂY LÀ CÁC THÔNG TIN TRÍCH XUẤT TỪ TÀI LIỆU HƯỚNG DẪN TUYỂN SINH. Việc trả lời PHẢI dựa trên thông tin này:\n\n${docsContent}\n`;
    }

    // Build prompt
    const prompt = `${SYSTEM_PROMPT}${knowledgeContext}${conversationContext}\n\nCâu hỏi hiện tại: ${message}\n\nTrả lời:`;

    console.log(`[Chat] Prompt size: ${Math.round(prompt.length / 1024)}KB, starting Gemini call at +${Date.now() - startTime}ms`);

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(`[Chat] Gemini responded at +${Date.now() - startTime}ms`);

    // Save AI response to history
    history.push({ role: 'model', content: text });
    if (history.length > MAX_HISTORY) history.shift();
    conversationStore.set(sessionId, history);

    return NextResponse.json({
      response: text,
      sessionId: sessionId,
    });

  } catch (error: any) {
    console.error('[Chat] Error:', error?.message || error);

    const errorMsg = error?.message?.includes('API_KEY') || error?.message?.includes('api key')
      ? '❌ Lỗi API Key. Vui lòng kiểm tra GEMINI_API_KEY trong Vercel.'
      : error?.message?.includes('abort') || error?.message?.includes('timeout')
        ? '⏰ Hệ thống phản hồi chậm. Vui lòng thử lại.'
        : `❌ Lỗi: ${error?.message?.substring(0, 100) || 'Không xác định'}`;

    return NextResponse.json({
      response: errorMsg,
      sessionId: null,
    });
  }
}