import fs from 'fs';
import path from 'path';

const DOCUMENTS_DIR = path.join(process.cwd(), 'data', 'rag', 'documents');

console.log('Khởi chạy script tự động phân loại tài liệu RAG theo năm...');

// Regex tìm 4 chữ số liên tiếp từ 2010 đến 2030
const yearRegex = /(20[1-2][0-9])/;

function sortFilesByYear() {
    if (!fs.existsSync(DOCUMENTS_DIR)) {
        console.error('Không tìm thấy thư mục ' + DOCUMENTS_DIR);
        return;
    }

    const files = fs.readdirSync(DOCUMENTS_DIR);
    let movedCount = 0;

    for (const file of files) {
        const filePath = path.join(DOCUMENTS_DIR, file);

        // Chỉ xử lý file nằm ở thư mục root data/rag/documents
        if (fs.statSync(filePath).isFile()) {
            const match = file.match(yearRegex);

            if (match && match[1]) {
                const year = match[1];
                const yearDir = path.join(DOCUMENTS_DIR, year);

                // Tạo folder năm nếu chưa có
                if (!fs.existsSync(yearDir)) {
                    fs.mkdirSync(yearDir, { recursive: true });
                }

                // Di chuyển file
                const newPath = path.join(yearDir, file);
                fs.renameSync(filePath, newPath);
                console.log(`✅ Đã chuyển: ${file} --> [Thư mục ${year}]`);
                movedCount++;
            } else {
                console.log(`⏭️ Bỏ qua (không tìm thấy năm trong tên): ${file}`);
            }
        }
    }

    console.log(`\n🎉 Xong! Đã tự động phân loại ${movedCount} tài liệu.`);
    console.log(`💡 Mẹo: Những file cũ bạn có thể tự tạo thư mục (ví dụ /2024/) rồi kéo thả thủ công!`);
}

sortFilesByYear();
