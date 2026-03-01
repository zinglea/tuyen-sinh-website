import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
        return new NextResponse('Missing file parameter', { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public/doccuments', file);

    // Security check: ensure path is within public/doccuments to prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    const baseDir = path.resolve(process.cwd(), 'public/doccuments');
    if (!resolvedPath.startsWith(baseDir)) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(resolvedPath)) {
        return new NextResponse('File not found', { status: 404 });
    }

    try {
        const buffer = fs.readFileSync(resolvedPath);

        return new NextResponse(buffer, {
            headers: {
                // Force octet-stream to blind IDM (Internet Download Manager)
                // IDM hooks onto application/pdf, so we bypass it this way.
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `inline; filename="${file}"`,
                'Cache-Control': 'public, max-age=3600',
            }
        });
    } catch (error) {
        return new NextResponse('Error reading file', { status: 500 });
    }
}
