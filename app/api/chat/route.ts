import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

// Vercel serverless function timeout (seconds)
export const maxDuration = 30;

// Rate Limiter
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const LIMIT = 10;
const WINDOW_MS = 60 * 1000;

// Conversation history (in-memory)
const conversationStore = new Map<string, { role: string, content: string }[]>();
const MAX_HISTORY = 10;

const currentYear = new Date().getFullYear();

const SYSTEM_PROMPT = `
BẠN LÀ TRỢ LÝ AI TƯ VẤN TUYỂN SINH CỦA CÔNG AN TỈNH CAO BẰNG.
⏰ THỜI GIAN HIỆN TẠI (Năm nay): ${currentYear}.

QUY TẮC TRẢ LỜI NGHIÊM NGẶT:
- Lịch sự, thân thiện, trả lời dễ hiểu bằng tiếng Việt.
- Dùng bullet points và dấu sao **in đậm** từ khóa. Luôn dùng emoji (📌,✅,💡).
- KHÔNG dùng Math/LaTeX. Không bốc phét.

QUY TẮC THỜI GIAN VÀ CHỐNG SUY DIỄN (ANTI-HALLUCINATION):
1. ƯU TIÊN THỜI GIAN: Nếu thí sinh hỏi về "năm nay", hãy ƯU TIÊN TUYỆT ĐỐI tìm kiếm và lọc các thông tin của [Tài Liệu - Năm: ${currentYear}]. Lờ đi các tài liệu cũ nếu thông tin xung đột.
2. NẾU THIẾU DỮ LIỆU NĂM NAY: Nếu TẤT CẢ [Tài Liệu] bên dưới đều là của các năm trước (vd: ${currentYear - 1}), hãy MỞ ĐẦU câu trả lời: "Hiện tại Hệ thống chưa cập nhật văn bản hướng dẫn chính thức cho năm ${currentYear}. Theo quy định gần nhất là năm cũ, bạn có thể tham khảo..."
3. DẪN CHIẾU VĂN BẢN: Nếu tài liệu năm ${currentYear} có nhắc đến "thực hiện theo" một văn bản cũ (ví dụ: Thông tư 62 năm 2023), tự động đối chiếu nội dung của văn bản cũ đó trong đống [Tài Liệu] được cấp để trả lời.
4. KILL-SWITCH (DẬP TẮT SUY DIỄN): Tuyệt đối KHÔNG BỊA ĐẶT nội dung luật nằm ngoài [Tài Liệu] bên dưới. Nếu [Tài Liệu] bắt phải tuân theo Thông tư 62, nhưng CHÍNH QUÁ TRÌNH LỤC TÌM BÊN DƯỚI lại KHÔNG HỀ CÓ nội dung chi tiết của Thông tư 62, PHẢI THÚ NHẬN: 
   "Theo hướng dẫn mới nhất, thí sinh cần tham chiếu Thông tư/văn bản liên quan. Tuy nhiên, nội dung chi tiết của văn bản phần này chưa được Quản trị viên cập nhật vào Hệ thống kho dữ liệu Trợ lý ảo. Bạn vui lòng liên hệ Đường dây nóng của Hội đồng tuyển sinh - Phòng TCCB Công an Tỉnh để được tư vấn chính xác!"
5. GIỚI HẠN VĂN BẢN DỰ THẢO: Nếu TẤT CẢ [Tài Liệu] trích xuất đều mang nhãn cảnh báo "⚠️ VĂN BẢN DỰ THẢO" hoặc thông tin chủ yếu lấy từ tài liệu này, bạn BẮT BUỘC phải xuống dòng và kết thúc phần Trả lời bằng dòng thông báo NGHIÊM NGẶT sau (in đậm):
   **"⚠️ Lưu ý: Nội dung trên được tham chiếu từ văn bản hiện đang là Dự thảo, chưa có văn bản công bố chính thức. Thí sinh vui lòng theo dõi thêm để cập nhật Quyết định/Hướng dẫn chính thức từ Bộ Công an hoặc liên hệ trực tiếp HĐTS."**
6. CHI TIẾT ĐỐI TƯỢNG ƯU TIÊN: Khi trình bày các tiêu chuẩn (đặc biệt là chiều cao, sức khỏe), BẮT BUỘC KHÔNG ĐƯỢC BỎ SÓT hoặc GỘP CHUNG các đối tượng ưu tiên khác nhau. Ví dụ: "Dân tộc thiểu số" và "Dân tộc thiểu số RẤT ÍT NGƯỜI" là hai đối tượng có ngưỡng tiêu chuẩn khác nhau, phải liệt kê tách bạch cả hai. LUÔN LUÔN đọc kỹ từng con số trong [Tài Liệu] để trả lời chính xác nhất.
7. ĐẢM BẢO HOÀN THÀNH CÂU TRẢ LỜI: Tuyệt đối KHÔNG DỪNG GIỮA CHỪNG. Bạn được cung cấp không gian phản hồi lớn, hãy đảm bảo luận điểm của câu cuối cùng được hoàn thiện (VD: kết luận rõ ràng, hoặc lời mời gọi theo dõi tiếp). Không được nhả ra một nửa câu rồi ngừng luồng trả lời.
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
    // 1. Nhúng (Embed) câu hỏi của user: Bỏ "Năm XXXX" ra khỏi query để tránh làm nhiễu semantic context.
    const optimizedQuery = message;
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embedResult = await embeddingModel.embedContent(optimizedQuery);
    const queryVector = embedResult.embedding.values;

    // 2. Tìm kiếm trong Supabase sử dụng RPC match_documents
    console.log(`[Chat] Querying Supabase vector database...`);
    const { data: matchedDocs, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_threshold: 0.5, // Ngưỡng độ chính xác (0.0 đến 1.0)
      match_count: 25       // ✅ HUGE CONTEXT: Lấy 25 mảnh để gom sạch các văn bản dẫn chiếu chéo của năm cũ
    });

    if (matchError) {
      console.error("Supabase match_documents error:", matchError);
    }

    // 3. Xây dựng Context từ tài liệu tìm được
    let knowledgeContext = '';
    if (matchedDocs && matchedDocs.length > 0) {
      // ✅ Bơm Metadata Năm ban hành thẳng vào chữ
      const docsContent = matchedDocs.map((doc: any, index: number) => {
        const draftStatus = doc.metadata?.isDraft ? ' - ⚠️ VĂN BẢN DỰ THẢO' : '';
        return `[Tài Liệu ${index + 1} - Năm: ${doc.year || 'Chưa rõ'} - Nguồn: ${doc.metadata?.source || 'Khuyết danh'}${draftStatus}]: \n${doc.content} `;
      }).join('\n\n--- Dấu phân Cách ---\n\n');
      knowledgeContext = `\n\n⬇️ DƯỚI ĐÂY LÀ KHO DỮ LIỆU ĐƯỢC CHẮT LỌC.CẤM BỊA ĐẶT NÀO NẰM NGOÀI: \n\n${docsContent} \n`;
    }

    // Build prompt
    const prompt = `${SYSTEM_PROMPT}${knowledgeContext}${conversationContext} \n\nCâu hỏi hiện tại: ${message} \n\nTrả lời: `;

    console.log(`[Chat] Prompt size: ${Math.round(prompt.length / 1024)} KB, starting Gemini call at + ${Date.now() - startTime} ms`);

    // Call Gemini using AI SDK
    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    console.log(`[Chat] Calling Gemini with AI SDK at + ${Date.now() - startTime} ms`);

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      prompt: prompt,
      onFinish({ text }) {
        // Save history after stream finishes
        history.push({ role: 'model', content: text });
        if (history.length > MAX_HISTORY) history.shift();
        conversationStore.set(sessionId, history);
      }
    });

    return result.toTextStreamResponse({
      headers: {
        'x-session-id': sessionId,
      }
    });

  } catch (error: any) {
    console.error('[Chat] Error:', error?.message || error);

    const errorMsg = error?.message?.includes('API_KEY') || error?.message?.includes('api key')
      ? '❌ Lỗi API Key. Vui lòng kiểm tra GEMINI_API_KEY trong Vercel.'
      : error?.message?.includes('abort') || error?.message?.includes('timeout')
        ? '⏰ Hệ thống phản hồi chậm. Vui lòng thử lại.'
        : `❌ Lỗi: ${error?.message?.substring(0, 100) || 'Không xác định'} `;

    return NextResponse.json({
      response: errorMsg,
      sessionId: null,
    }, { status: 500 });
  }
}