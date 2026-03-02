import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy PDF from Supabase Storage URL → stream to client
 * Hides the original Supabase URL from IDM and download managers
 * 
 * Usage: /api/view-pdf?url=https://xxx.supabase.co/storage/v1/object/public/...
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const fileUrl = searchParams.get('url')

        if (!fileUrl) {
            return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
        }

        // Only allow Supabase URLs for security
        if (!fileUrl.includes('supabase.co')) {
            return NextResponse.json({ error: 'Invalid URL source' }, { status: 403 })
        }

        // Fetch PDF from Supabase
        const response = await fetch(fileUrl)

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 })
        }

        const buffer = await response.arrayBuffer()

        // Return as octet-stream to hide from IDM
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'inline',
                'Cache-Control': 'public, max-age=3600',
            },
        })
    } catch (e) {
        console.error('view-pdf error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
