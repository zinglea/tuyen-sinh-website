import { NextRequest, NextResponse } from 'next/server';
import { getVectorStore } from '@/utils/rag';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Thiếu GEMINI_API_KEY' },
        { status: 500 }
      );
    }

    const stats = getVectorStore(apiKey).getStats();

    return NextResponse.json({
      success: true,
      message: 'RAG data loaded from pre-processed files. To update, process documents locally and push to repo.',
      stats,
    });

  } catch (error) {
    console.error('Lỗi xử lý:', error);
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    );
  }
}
