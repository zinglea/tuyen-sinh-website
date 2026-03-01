import { NextRequest, NextResponse } from 'next/server';
import { getVectorStore, SearchResult } from '@/utils/rag';

export async function POST(req: NextRequest) {
  try {
    const { query, topK = 5 } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Thiếu query' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Thiếu GEMINI_API_KEY' },
        { status: 500 }
      );
    }

    const store = getVectorStore(apiKey);
    const results = await store.search(query, topK);

    return NextResponse.json({
      success: true,
      results: results.map((r: SearchResult) => ({
        content: r.chunk.content,
        source: r.chunk.source,
        type: r.chunk.type,
        metadata: r.chunk.metadata,
        score: r.score,
      })),
    });

  } catch (error) {
    console.error('Lỗi tìm kiếm:', error);
    return NextResponse.json(
      { error: 'Lỗi server khi tìm kiếm' },
      { status: 500 }
    );
  }
}
