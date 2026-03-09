/**
 * Script để xử lý tất cả files trong knowledge base (chạy trên máy local)
 * 
 * Quy trình:
 * 1. Đặt documents (.docx, .txt, .pdf) vào data/rag/documents/
 * 2. Chạy: npx ts-node scripts/process-knowledge-base.ts
 * 3. Kết quả JSON sẽ lưu vào data/rag/processed/
 * 4. Commit & push lên GitHub → Vercel tự động deploy
 */

import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
// @ts-ignore - pdf-parse v2 CJS
const { PDFParse } = require('pdf-parse');

const CHUNK_SIZE = 5000;
const CHUNK_OVERLAP = 1500;

const DATA_RAG_DIR = path.join(process.cwd(), 'data', 'rag');
const DOCUMENTS_DIR = path.join(DATA_RAG_DIR, 'documents');
const PROCESSED_DIR = path.join(DATA_RAG_DIR, 'processed');

// Ensure directories exist
[DOCUMENTS_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function processDocument(filePath: string): Promise<void> {
  const filename = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  let content = '';
  let type: 'text' | 'docx' | 'pdf' = 'text';

  if (ext === '.txt') {
    content = fs.readFileSync(filePath, 'utf-8');
    type = 'text';
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    content = result.value;
    type = 'docx';
  } else if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    content = result.text;
    await parser.destroy();
    type = 'pdf';
  } else {
    console.log(`⏭️  Bỏ qua: ${filename} (chưa hỗ trợ ${ext})`);
    return;
  }

  if (!content.trim()) {
    console.log(`⚠️  File rỗng: ${filename}`);
    return;
  }

  const stat = fs.statSync(filePath);
  const docId = `doc_${filename.replace(/\.[^/.]+$/, "")}`; // Removes original extension

  // Trích xuất Năm từ tên thư mục cha
  const relativeFromDocuments = path.relative(DOCUMENTS_DIR, filePath);
  const pathParts = relativeFromDocuments.split(path.sep);
  let year: number | null = null;
  if (pathParts.length > 1) {
    const possibleYear = parseInt(pathParts[0], 10);
    if (!isNaN(possibleYear)) {
      year = possibleYear;
    }
  }

  const processedDoc = {
    id: docId,
    filename,
    content,
    type,
    metadata: {
      year: year,
      filePath: path.relative(process.cwd(), filePath),
      size: stat.size,
      modified: stat.mtime.toISOString(),
      isDraft: filename.includes('DỰ THẢO') || filename.includes('DU THAO') || content.substring(0, 500).includes('DỰ THẢO') || content.substring(0, 500).includes('DU THAO'),
    },
  };

  const outputPath = path.join(PROCESSED_DIR, `${docId}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(processedDoc, null, 2), 'utf-8');

  console.log(`✅ ${filename} → ${docId}.json (${content.length} ký tự)`);
}

async function main() {
  console.log('\n🚀 Xử lý Knowledge Base (Local)\n');
  console.log(`📁 Documents: ${DOCUMENTS_DIR}`);
  console.log(`📁 Output:    ${PROCESSED_DIR}\n`);

  // Đọc lặp đệ quy tất cả các file trong thư mục DOCUMENTS_DIR và các thư mục con
  function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      if (!file.startsWith('.') && !file.startsWith('~$')) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
          arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else if (file.endsWith('.txt') || file.endsWith('.docx') || file.endsWith('.pdf')) {
          arrayOfFiles.push(path.join(dirPath, "/", file));
        }
      }
    });
    return arrayOfFiles;
  }

  const files = getAllFiles(DOCUMENTS_DIR);

  if (files.length === 0) {
    console.log('❌ Không có file nào trong data/rag/documents/');
    console.log('   Hãy tạo các thư mục tên Năm (vd: 2024, 2025, 2026) và copy documents vào đó rồi chạy lại.\n');
    return;
  }

  console.log(`📄 Tìm thấy ${files.length} files:\n`);

  let processed = 0;
  for (const file of files) {
    try {
      await processDocument(file); // filePath là Absolute Path từ getAllFiles
      processed++;
    } catch (error) {
      console.error(`❌ Lỗi xử lý ${file}:`, error);
    }
  }

  console.log(`\n✅ Xong! Đã xử lý ${processed}/${files.length} files.`);
  console.log('\n📌 Tiếp theo:');
  console.log('   git add data/rag/processed/');
  console.log('   git commit -m "Update RAG data"');
  console.log('   git push');
  console.log('   → Vercel sẽ tự động deploy với dữ liệu mới!\n');
}

main();
