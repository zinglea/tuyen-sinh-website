import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Vercel serverless function timeout (seconds)
export const maxDuration = 30;

// Rate Limiter
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const LIMIT = 10;
const WINDOW_MS = 60 * 1000;

// Conversation history (in-memory)
const conversationStore = new Map<string, { role: string, content: string }[]>();
const MAX_HISTORY = 10;

// Load knowledge base once (cached across requests in same instance)
let knowledgeBase = '';
function getKnowledgeBase(): string {
  if (knowledgeBase) return knowledgeBase;

  try {
    const kbPath = path.join(process.cwd(), 'data', 'rag', 'knowledge.txt');
    if (fs.existsSync(kbPath)) {
      knowledgeBase = fs.readFileSync(kbPath, 'utf-8');
      console.log(`[Chat] Loaded knowledge base: ${Math.round(knowledgeBase.length / 1024)}KB`);
    }
  } catch (error) {
    console.error('[Chat] Failed to load knowledge base:', error);
  }

  return knowledgeBase;
}

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

    // Load knowledge base
    const kb = getKnowledgeBase();
    const knowledgeContext = kb
      ? `\n\nDƯỚI ĐÂY LÀ TÀI LIỆU HƯỚNG DẪN TUYỂN SINH CHÍNH THỨC (BỘ CÔNG AN). Hãy dựa vào tài liệu này để trả lời:\n\n${kb}\n`
      : '';

    // Build prompt
    const prompt = `${SYSTEM_PROMPT}${knowledgeContext}${conversationContext}\n\nCâu hỏi hiện tại: ${message}\n\nTrả lời:`;

    console.log(`[Chat] Prompt size: ${Math.round(prompt.length / 1024)}KB, starting Gemini call at +${Date.now() - startTime}ms`);

    // Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
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