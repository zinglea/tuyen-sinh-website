/**
 * Script để xử lý tất cả files trong knowledge base
 * Chạy: npx ts-node scripts/process-knowledge-base.ts
 */

import { processAllFiles } from '../utils/rag';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Thiếu GEMINI_API_KEY trong .env.local');
    process.exit(1);
  }

  console.log('🚀 Bắt đầu xử lý knowledge base...\n');

  const result = await processAllFiles(apiKey);

  if (result.success) {
    console.log(`✅ Đã xử lý ${result.processed} files thành công!`);
    if (result.errors.length > 0) {
      console.log('\n⚠️  Cảnh báo:');
      result.errors.forEach(err => console.log(`   - ${err}`));
    }
  } else {
    console.error('❌ Có lỗi xảy ra:');
    result.errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1);
  }
}

main();
