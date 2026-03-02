import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const path = url.searchParams.get('path');

    if (!path) return new Response('Missing path', { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return new Response('Server configuration error', { status: 500 });

    const targetUrl = `${supabaseUrl}/storage/v1/object/public/${path}`;

    try {
        const res = await fetch(targetUrl);
        if (!res.ok) {
            return new Response('File not found', { status: res.status });
        }

        const headers = new Headers();
        const contentType = res.headers.get('content-type');
        if (contentType) headers.set('Content-Type', contentType);

        const cacheControl = res.headers.get('cache-control');
        headers.set('Cache-Control', cacheControl || 'public, max-age=3600');

        return new Response(res.body, { status: 200, headers });
    } catch (e) {
        return new Response('Error fetching file', { status: 500 });
    }
}
