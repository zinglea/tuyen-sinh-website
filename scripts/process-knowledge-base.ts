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
  } else {
    console.log(`⏭️  Bỏ qua: ${filename} (chưa hỗ trợ ${ext})`);
    return;
  }

  if (!content.trim()) {
    console.log(`⚠️  File rỗng: ${filename}`);
    return;
  }

  const stat = fs.statSync(filePath);
  const docId = `doc_${filename}_${Date.now()}`;

  const processedDoc = {
    id: docId,
    filename,
    content,
    type,
    metadata: {
      filePath: path.relative(process.cwd(), filePath),
      size: stat.size,
      modified: stat.mtime.toISOString(),
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

  const files = fs.readdirSync(DOCUMENTS_DIR).filter(f =>
    !f.startsWith('.') && (f.endsWith('.txt') || f.endsWith('.docx'))
  );

  if (files.length === 0) {
    console.log('❌ Không có file nào trong data/rag/documents/');
    console.log('   Hãy copy documents (.docx, .txt) vào thư mục trên rồi chạy lại.\n');
    return;
  }

  console.log(`📄 Tìm thấy ${files.length} files:\n`);

  let processed = 0;
  for (const file of files) {
    try {
      await processDocument(path.join(DOCUMENTS_DIR, file));
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
