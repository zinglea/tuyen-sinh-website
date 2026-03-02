import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { parsePptx } from '@/utils/pptxParser'
import { extractVideoUrlsFromText, videoUrlToEmbed, processVideoInHtml, extractVideoUrlsFromDocx, processDoublehashSyntax } from '@/utils/docxParser'
import fs from 'fs'
import path from 'path'
import os from 'os'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const fileName = file.name
        const ext = fileName.split('.').pop()?.toLowerCase() || ''
        const buffer = Buffer.from(await file.arrayBuffer())

        // Save temp file for processing
        const tmpDir = os.tmpdir()
        const tmpPath = path.join(tmpDir, `upload_${Date.now()}_${fileName}`)
        fs.writeFileSync(tmpPath, buffer)

        let html = ''
        let rawText = ''

        try {
            if (ext === 'docx' || ext === 'doc') {
                // Parse DOCX with mammoth - images as base64
                const options = {
                    convertImage: mammoth.images.imgElement(function (image: any) {
                        return image.read("base64").then(function (imageBuffer: string) {
                            return {
                                src: "data:" + image.contentType + ";base64," + imageBuffer
                            }
                        })
                    })
                }

                const result = await mammoth.convertToHtml({ path: tmpPath }, options)
                html = result.value

                const textResult = await mammoth.extractRawText({ path: tmpPath })
                rawText = textResult.value.trim()

                // Extract and embed videos
                let docxVideoUrls: string[] = []
                try { docxVideoUrls = await extractVideoUrlsFromDocx(tmpPath) } catch (e) { }
                const textVideoUrls = extractVideoUrlsFromText(rawText)
                const allVideoUrls = Array.from(new Set([...docxVideoUrls, ...textVideoUrls]))

                if (allVideoUrls.length > 0) {
                    html = processVideoInHtml(html, allVideoUrls)
                }

            } else if (ext === 'pptx' || ext === 'ppt') {
                // Parse PPTX
                const pptxResult = await parsePptx(tmpPath)
                html = pptxResult.html
                rawText = pptxResult.rawText

            } else if (ext === 'pdf') {
                // PDF: we don't parse content, just show the PDF viewer
                html = `__PDF_FILE__`

            } else if (ext === 'xlsx' || ext === 'xls') {
                // Excel: render as download
                html = `<div style="text-align:center;padding:3rem;background:#f0fdf4;border-radius:12px;border:2px dashed #86efac;">
                    <h3 style="font-size:1.25rem;font-weight:bold;color:#166534;">📊 File Excel đính kèm</h3>
                    <p style="color:#4ade80;margin-top:0.5rem;">File này sẽ hiển thị dưới dạng tải xuống.</p>
                </div>`

            } else {
                html = `<p>Định dạng .${ext} chưa được hỗ trợ xem trực tiếp.</p>`
            }
        } finally {
            // Cleanup temp file
            try { fs.unlinkSync(tmpPath) } catch (e) { }
        }

        // Clean metadata tags from HTML (same as docxParser)
        const metaTags = ['#Loaivb:', '#Tieude:', '#Tacgia:', '#Ngay:', '#Video:']
        for (const tag of metaTags) {
            const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            html = html.replace(new RegExp('<p[^>]*>.*?' + escaped + '.*?<\\/p>', 'ig'), '')
            html = html.replace(new RegExp('<h[1-6][^>]*>.*?' + escaped + '.*?<\\/h[1-6]>', 'ig'), '')
        }
        html = html.replace(/<p[^>]*>.*?#n[ộoiỉ]\s*dung:.*?<\/p>/ig, '')

        // Process ##caption## and ##videoUrl## syntax
        html = processDoublehashSyntax(html)

        // Extract excerpt from raw text
        let excerpt = rawText
            .replace(/#Loaivb:.*|#Tieude:.*|#Tacgia:.*|#Ngay:.*|#Video:.*|#n[ộoiỉ]\s*dung:.*/gi, '')
            .replace(/https?:\/\/[^\s]+/g, '')
            .trim()
            .substring(0, 200)

        return NextResponse.json({
            success: true,
            html,
            excerpt,
            fileType: ext,
        })

    } catch (error: any) {
        console.error('Parse upload error:', error)
        return NextResponse.json({ error: error.message || 'Parse failed' }, { status: 500 })
    }
}
