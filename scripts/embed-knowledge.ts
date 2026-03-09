import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import 'dotenv/config'; // Tự động load .env.local trong CWD nếu có
// Hoặc load tường minh
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// --- Cấu hình ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Tuỳ chọn: dùng service_role key để bypass RLS nếu không muốn vướng quyền insert
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_KEY)) {
    console.error("❌ Lỗi: Thiếu biến môi trường. Vui lòng kiểm tra .env.local");
    console.error("Cần: GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, và NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
}

// Khởi tạo SDK
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// const supabaseKey = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY || ''; // Dùng service key nếu có
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || ''); // Tạm dùng anon key

const PROCESSED_DIR = path.join(process.cwd(), 'data', 'rag', 'processed');

// Hàm chunking: cắt text thành các đoạn nhỏ hơn (ví dụ 1000 ký tự)
// Lưu ý: Đây là cách cắt đơn giản. Tốt nhất là cắt theo câu hoặc đoạn văn (\n\n).
function chunkText(text: string, maxChunkSize = 5000): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split('\n\n');

    let currentChunk = '';

    for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length > maxChunkSize) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }

    if (currentChunk) chunks.push(currentChunk.trim());

    // Nếu một đoạn vẫn quá dài, cắt cứng (fallback)
    const finalChunks: string[] = [];
    for (let chunk of chunks) {
        if (chunk.length > maxChunkSize * 1.5) {
            let i = 0;
            while (i < chunk.length) {
                finalChunks.push(chunk.substring(i, i + maxChunkSize));
                i += maxChunkSize;
            }
        } else {
            finalChunks.push(chunk);
        }
    }

    return finalChunks;
}

async function getEmbedding(text: string): Promise<number[]> {
    // Gemini model cho embedding là gemini-embedding-001
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    return embedding.values;
}

async function main() {
    console.log("🚀 Bắt đầu quá trình tạo Embedding và upload lên Supabase...");

    console.log('Xóa toàn bộ dữ liệu vector cũ trong bảng documents_embeddings để tránh trùng lặp...');
    const { error: deleteError } = await supabase
        .from('documents_embeddings')
        .delete()
        .not('id', 'is', null); // Delete all rows

    if (deleteError) {
        console.error('❌ Lỗi khi xóa dữ liệu cũ:', deleteError);
        return;
    }
    console.log('✅ Đã dọn sạch dữ liệu cũ.\n');

    if (!fs.existsSync(PROCESSED_DIR)) {
        console.error(`❌ Không tìm thấy thư mục dữ liệu: ${PROCESSED_DIR}`);
        return;
    }

    const files = fs.readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.json'));
    console.log(`📄 Tìm thấy ${files.length} file tài liệu đã xử lý (.json).`);

    let totalChunks = 0;
    let successChunks = 0;

    for (const file of files) {
        const filePath = path.join(PROCESSED_DIR, file);
        try {
            const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const textContent = fileData.content || '';
            const filename = fileData.filename || file;

            if (!textContent.trim()) {
                console.log(`⚠️ Bỏ qua file rỗng: ${filename}`);
                continue;
            }

            console.log(`\n⏳ Đang xử lý file: ${filename} (${Math.round(textContent.length / 1024)}KB)`);

            // 1. Chia nhỏ văn bản với block lớn (bao trọn từng Mục/Phần)
            const chunks = chunkText(textContent, 4800);
            console.log(`   ✂️ Đã cắt thành ${chunks.length} đoạn nhỏ.`);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                if (chunk.trim().length < 50) continue; // Bỏ qua đoạn quá ngắn

                totalChunks++;

                try {
                    // 2. Tạo Vector
                    const embeddingVector = await getEmbedding(chunk);

                    // 3. Chuẩn bị Metadata
                    const metadata = {
                        source: filename,
                        docId: fileData.id || file,
                        chunkIndex: i,
                        totalChunks: chunks.length,
                    };

                    // 4. Insert lên Supabase (Gắn thêm trường year)
                    const yearData = fileData.metadata?.year ? fileData.metadata.year : null;

                    const { error } = await supabase
                        .from('documents_embeddings')
                        .insert({
                            content: chunk,
                            metadata: metadata,
                            embedding: embeddingVector,
                            year: yearData
                        });

                    if (error) {
                        console.error(`   ❌ Lỗi insert chunk ${i} của ${filename}:`, error.message);
                    } else {
                        successChunks++;
                        process.stdout.write('.'); // In dấu chấm thể hiện tiến độ
                    }

                    // Chờ 1 chút để tránh rate limit của Gemini API
                    await new Promise(r => setTimeout(r, 1000));

                } catch (embedError: any) {
                    console.error(`   ❌ Lỗi Embed chunk ${i} cục bộ:`, embedError?.message || 'Unknown Error');
                }
            }

        } catch (e) {
            console.error(`❌ Lỗi đọc file ${file}:`, e);
        }
    }

    console.log(`\n\n✅ ĐÃ HOÀN THÀNH!`);
    console.log(`📊 Báo cáo: Đã insert thành công ${successChunks} / ${totalChunks} đoạn văn bản (chunks) vào Supabase.`);
}

main().catch(console.error);
