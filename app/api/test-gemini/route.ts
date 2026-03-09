import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

// Test endpoint to verify Gemini API key works
export const maxDuration = 15;

export async function GET() {
    const start = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({
            error: 'GEMINI_API_KEY not set',
            time: Date.now() - start
        }, { status: 500 });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const t1 = Date.now();
        const result = await model.generateContent('Nói "xin chào" bằng tiếng Việt, chỉ 1 câu ngắn.');
        const response = await result.response;
        const text = response.text();
        const t2 = Date.now();

        return NextResponse.json({
            success: true,
            response: text,
            apiCallMs: t2 - t1,
            totalMs: Date.now() - start,
            keyPrefix: apiKey.substring(0, 8) + '...',
        });
    } catch (error: any) {
        return NextResponse.json({
            error: error?.message || 'Unknown error',
            errorType: error?.constructor?.name,
            totalMs: Date.now() - start,
            keyPrefix: apiKey.substring(0, 8) + '...',
        }, { status: 500 });
    }
}
