import { NextRequest, NextResponse } from 'next/server';
import { processAllFiles, getVectorStore } from '@/utils/rag';

// Admin password for security (should be set in environment variable)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function POST(req: NextRequest) {
  try {
    // Verify admin password
    const { password } = await req.json();
    
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized - Sai mật khẩu admin' },
        { status: 401 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Thiếu GEMINI_API_KEY' },
        { status: 500 }
      );
    }

    // Process all files
    const result = await processAllFiles(apiKey);
    
    const stats = getVectorStore(apiKey).getStats();

    return NextResponse.json({
      success: true,
      message: `Đã xử lý ${result.processed} files thành công`,
      stats,
      errors: result.errors,
    });

  } catch (error) {
    console.error('Lỗi xử lý files:', error);
    return NextResponse.json(
      { error: 'Lỗi server khi xử lý files' },
      { status: 500 }
    );
  }
}
