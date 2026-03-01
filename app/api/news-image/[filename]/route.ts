import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
    const resolvedParams = await params;
    const filename = resolvedParams.filename;

    // Prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'data/news', safeFilename);

    if (!fs.existsSync(filePath)) {
        return new NextResponse('Image not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    const ext = path.extname(safeFilename).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': contentType,
            // Cache the image for better performance
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        },
    });
}
