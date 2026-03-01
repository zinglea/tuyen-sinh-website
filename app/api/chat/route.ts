import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

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

THÔNG TIN TUYỂN SINH NĂM 2026:

1. ĐIỀU KIỆN DỰ TUYỂN:
- Độ tuổi: Từ 18 đến 22 tuổi. Cán bộ, chiến sĩ nghĩa vụ hoặc xuất ngũ có thể cao hơn.
- Tốt nghiệp THPT hoặc tương đương.
- Thường trú tại tỉnh Cao Bằng.
- Chiều cao: Nam >= 1.64m, Nữ >= 1.58m.

2. CÁC TRƯỜNG: Học viện ANND, Học viện CSND, ĐH PCCC, ĐH Kỹ thuật - Hậu cần CAND...

3. CHẾ ĐỘ: Miễn học phí, bao ăn ở, phụ cấp sinh hoạt, BHYT.

4. LIÊN HỆ: Phòng Tổ chức cán bộ - Công an tỉnh Cao Bằng.

QUY TẮC TRẢ LỜI:
- Lịch sự, thân thiện, ngắn gọn
- Luôn trả lời bằng tiếng Việt
- KHÔNG dùng LaTeX ($$), viết text thuần
- Dùng emoji: 📌 thông tin quan trọng, ✅ điều kiện, 💡 lưu ý
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
        history.slice(0, -1).map((msg, i) =>
          `${msg.role === 'user' ? 'Thí sinh' : 'AI'}: ${msg.content.substring(0, 150)}`
        ).join('\n') + '\n';
    }

    // Build prompt
    const prompt = `${SYSTEM_PROMPT}${conversationContext}\n\nCâu hỏi: ${message}\n\nTrả lời bằng tiếng Việt:`;

    console.log(`[Chat] Starting Gemini call at +${Date.now() - startTime}ms`);

    // Call Gemini with timeout
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const result = await model.generateContent(prompt);
      clearTimeout(timeout);

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
        _debug: { totalMs: Date.now() - startTime }
      });
    } catch (genError: any) {
      clearTimeout(timeout);
      console.error(`[Chat] Gemini error at +${Date.now() - startTime}ms:`, genError?.message);
      throw genError;
    }

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
      _debug: { error: error?.message, totalMs: Date.now() - startTime }
    });
  }
}