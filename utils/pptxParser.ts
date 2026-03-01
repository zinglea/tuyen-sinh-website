import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

/**
 * Parse a PPTX file and convert it to HTML slides with embedded media support.
 * 
 * PPTX (Office Open XML) is a ZIP archive containing:
 * - ppt/slides/slide{N}.xml - individual slide XML
 * - ppt/media/ - embedded images, videos, audio
 * - ppt/_rels/presentation.xml.rels - relationships
 * - ppt/slides/_rels/slide{N}.xml.rels - per-slide relationships
 * - ppt/presentation.xml - presentation metadata
 */

interface SlideData {
    index: number;
    texts: string[];
    images: { data: string; contentType: string }[];
    videoUrls: string[];
    audioUrls: string[];
    mediaFiles: { name: string; data: string; contentType: string }[];
}

interface PptxResult {
    slides: SlideData[];
    html: string;
    rawText: string;
    title: string;
    slideCount: number;
}

/**
 * Extract text content from slide XML
 */
function extractTextsFromSlideXml(xml: string): string[] {
    const texts: string[] = [];

    // Match all <a:t> text elements (PowerPoint text runs)
    const textMatches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g);
    if (textMatches) {
        let currentParagraph = '';
        // Track paragraph boundaries via <a:p> tags
        const paragraphs = xml.split(/<a:p[\s>]/);

        for (const para of paragraphs) {
            const paraTexts = para.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g);
            if (paraTexts) {
                const paraContent = paraTexts
                    .map(t => {
                        const m = t.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/);
                        return m ? m[1] : '';
                    })
                    .join('')
                    .trim();
                if (paraContent) {
                    texts.push(paraContent);
                }
            }
        }
    }

    return texts;
}

/**
 * Extract hyperlink/video/audio URLs from slide relationship XML
 */
function extractMediaRelsFromXml(relsXml: string): { images: string[]; videos: string[]; audios: string[]; hyperlinks: string[]; rIdToTarget: Record<string, string> } {
    const result = { images: [] as string[], videos: [] as string[], audios: [] as string[], hyperlinks: [] as string[], rIdToTarget: {} as Record<string, string> };

    // Find all Relationship elements
    const relMatches = relsXml.match(/<Relationship[^>]+>/g) || [];

    for (const rel of relMatches) {
        const typeMatch = rel.match(/Type="([^"]+)"/);
        const targetMatch = rel.match(/Target="([^"]+)"/);
        const targetModeMatch = rel.match(/TargetMode="([^"]+)"/);
        const idMatch = rel.match(/Id="([^"]+)"/);

        if (!typeMatch || !targetMatch) continue;

        const type = typeMatch[1];
        const target = targetMatch[1];
        const isExternal = targetModeMatch && targetModeMatch[1] === 'External';

        if (idMatch) {
            result.rIdToTarget[idMatch[1]] = target;
        }

        if (type.includes('/image')) {
            result.images.push(target);
        } else if (type.includes('/video') || type.includes('/audio')) {
            if (isExternal) {
                if (type.includes('/video')) result.videos.push(target);
                else result.audios.push(target);
            } else {
                if (type.includes('/video')) result.videos.push(target);
                else result.audios.push(target);
            }
        } else if (type.includes('/hyperlink') && isExternal) {
            result.hyperlinks.push(target);
        }
    }

    return result;
}

/**
 * Check if a URL is a video URL (YouTube, Facebook, etc.)
 */
function isVideoUrl(url: string): boolean {
    return /youtube\.com|youtu\.be|facebook\.com.*video|tiktok\.com.*video|\.mp4|\.webm|\.avi|\.mov/i.test(url);
}

/**
 * Convert video URL to embeddable HTML
 */
function videoUrlToEmbedHtml(url: string): string {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|v\/)|youtu\.be\/)([\w-]+)/);
    if (ytMatch) {
        return `<div class="pptx-video-container">
            <iframe src="https://www.youtube.com/embed/${ytMatch[1]}" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen loading="lazy" title="Video"></iframe>
        </div>`;
    }

    // Facebook video
    if (url.includes('facebook.com') && url.includes('video')) {
        return `<div class="pptx-video-container">
            <iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false" 
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" 
                allowfullscreen loading="lazy" title="Video Facebook"></iframe>
        </div>`;
    }

    // MP4/direct video
    if (/\.(mp4|webm|ogg|mov)$/i.test(url) || url.includes('.mp4') || url.includes('.webm')) {
        return `<div class="pptx-video-direct">
            <video controls preload="metadata">
                <source src="${url}" type="video/mp4">
                Trình duyệt không hỗ trợ video.
            </video>
        </div>`;
    }

    // Generic video link
    return ``;
}

/**
 * Convert audio URL to embeddable HTML
 */
function audioUrlToEmbedHtml(url: string, base64Data?: string, contentType?: string): string {
    if (base64Data && contentType) {
        return `<div class="pptx-audio-container">
            <audio controls preload="metadata">
                <source src="data:${contentType};base64,${base64Data}">
                Trình duyệt không hỗ trợ audio.
            </audio>
        </div>`;
    }
    return `<div class="pptx-audio-container">
        <audio controls preload="metadata">
            <source src="${url}">
            Trình duyệt không hỗ trợ audio.
        </audio>
    </div>`;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.emf': 'image/x-emf',
        '.wmf': 'image/x-wmf',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
        '.wma': 'audio/x-ms-wma',
    };
    return mimeMap[ext] || 'application/octet-stream';
}

/**
 * Parse a PPTX file and extract all slide content
 */
export async function parsePptx(filePath: string): Promise<PptxResult> {
    const buffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(buffer);

    const slides: SlideData[] = [];
    let allTexts: string[] = [];

    // Find all slide files, sorted by number
    const slideFiles = Object.keys(zip.files)
        .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
        .sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
            const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
            return numA - numB;
        });

    for (let i = 0; i < slideFiles.length; i++) {
        const slidePath = slideFiles[i];
        const slideNum = parseInt(slidePath.match(/slide(\d+)/)?.[1] || '0');
        const slideXml = await zip.file(slidePath)!.async('text');

        // Extract texts
        const rawTexts = extractTextsFromSlideXml(slideXml);
        allTexts = allTexts.concat(rawTexts);

        // Filter out metadata tags so they don't display on slides
        const texts = rawTexts.filter(t => !/(#(Loaivb|Tieude|Tacgia|Ngay|Video|n[ộoiỉ]\s*dung)):/i.test(t));

        // Extract relationships for this slide
        const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
        let mediaRels = { images: [] as string[], videos: [] as string[], audios: [] as string[], hyperlinks: [] as string[], rIdToTarget: {} as Record<string, string> };

        if (zip.file(relsPath)) {
            const relsXml = await zip.file(relsPath)!.async('text');
            mediaRels = extractMediaRelsFromXml(relsXml);
        }

        // Collect video URLs from hyperlinks
        const videoUrls = [
            ...mediaRels.videos,
            ...mediaRels.hyperlinks.filter(isVideoUrl),
        ];

        // Find video thumbnails to exclude them from the image list
        const videoThumbnailTargets = new Set<string>();
        const picMatches = slideXml.match(/<p:pic[\s\S]*?<\/p:pic>/g) || [];
        for (const pic of picMatches) {
            if (pic.includes('<a:videoFile')) {
                const blipMatch = pic.match(/<a:blip[^>]+r:embed="([^"]+)"/);
                if (blipMatch) {
                    const rId = blipMatch[1];
                    const target = mediaRels.rIdToTarget[rId];
                    if (target) videoThumbnailTargets.add(target);
                }
            }
        }

        // Read embedded images
        const images: { data: string; contentType: string }[] = [];
        for (const imgPath of mediaRels.images) {
            if (videoThumbnailTargets.has(imgPath)) continue; // Skip thumbnail

            const fullImgPath = imgPath.startsWith('..')
                ? `ppt/${imgPath.replace('../', '')}`
                : `ppt/slides/${imgPath}`;

            const imgFile = zip.file(fullImgPath);
            if (imgFile) {
                const imgData = await imgFile.async('base64');
                const contentType = getMimeType(fullImgPath);
                // Skip EMF/WMF as they don't render well in browsers
                if (!contentType.includes('emf') && !contentType.includes('wmf')) {
                    images.push({ data: imgData, contentType });
                }
            }
        }

        // Read embedded media files (video/audio inside the pptx)
        const mediaFiles: { name: string; data: string; contentType: string }[] = [];
        for (const mediaPath of [...mediaRels.videos, ...mediaRels.audios]) {
            if (mediaPath.startsWith('http')) continue; // external URL, handled separately

            const fullMediaPath = mediaPath.startsWith('..')
                ? `ppt/${mediaPath.replace('../', '')}`
                : `ppt/slides/${mediaPath}`;

            const mediaFile = zip.file(fullMediaPath);
            if (mediaFile) {
                const mediaData = await mediaFile.async('base64');
                const contentType = getMimeType(fullMediaPath);
                mediaFiles.push({ name: path.basename(fullMediaPath), data: mediaData, contentType });
            }
        }

        slides.push({
            index: i,
            texts,
            images,
            videoUrls,
            audioUrls: mediaRels.audios.filter(u => u.startsWith('http')),
            mediaFiles,
        });
    }

    // Also check for video URLs in text content (e.g., #Video: URL tags)
    const rawText = allTexts.join('\n');
    const videoTagPattern = /#[Vv]ideo:\s*(https?:\/\/[^\s]+)/g;
    let match;
    const textVideoUrls: string[] = [];
    while ((match = videoTagPattern.exec(rawText)) !== null) {
        textVideoUrls.push(match[1]);
    }

    // Detect plain YouTube URLs in text
    const youtubePattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/g;
    while ((match = youtubePattern.exec(rawText)) !== null) {
        const fullUrl = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
        if (!textVideoUrls.includes(fullUrl)) {
            textVideoUrls.push(fullUrl);
        }
    }

    // Add text-extracted video URLs to the first slide that doesn't already have them
    if (textVideoUrls.length > 0 && slides.length > 0) {
        const lastSlide = slides[slides.length - 1];
        for (const url of textVideoUrls) {
            if (!lastSlide.videoUrls.includes(url)) {
                lastSlide.videoUrls.push(url);
            }
        }
    }

    // Generate title from first slide
    const title = slides.length > 0 && slides[0].texts.length > 0
        ? slides[0].texts[0]
        : path.basename(filePath, '.pptx');

    // Generate HTML
    const html = generateSlidesHtml(slides);

    return {
        slides,
        html,
        rawText,
        title,
        slideCount: slides.length,
    };
}

/**
 * Generate beautiful HTML from parsed slides
 */
function generateSlidesHtml(slides: SlideData[]): string {
    if (slides.length === 0) return '<p>Không có nội dung slide.</p>';

    let html = `<div class="pptx-presentation" data-slide-count="${slides.length}">`;

    html += `<div class="pptx-slides-wrapper">`;

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const isFirst = i === 0;

        html += `<div class="pptx-slide ${isFirst ? 'pptx-slide-active' : ''}" data-slide-index="${i}">`;
        html += `<div class="pptx-slide-number">Trang ${i + 1}</div>`;
        html += `<div class="pptx-slide-content">`;

        let textHtml = '';
        let mediaHtml = '';

        // Render text content
        if (slide.texts.length > 0) {
            for (let j = 0; j < slide.texts.length; j++) {
                const text = slide.texts[j];
                // First text of first slide = main title
                if (i === 0 && j === 0) {
                    textHtml += `<h2 class="pptx-title">${escapeHtml(text)}</h2>`;
                } else if (j === 0) {
                    textHtml += `<h3 class="pptx-subtitle">${escapeHtml(text)}</h3>`;
                } else {
                    // Check if it looks like a bullet point
                    if (text.startsWith('•') || text.startsWith('-') || text.startsWith('●') || /^\\d+[\\.\\)]/.test(text)) {
                        textHtml += `<li class="pptx-bullet">${escapeHtml(text.replace(/^[•\\-●]\\s*/, '').replace(/^\\d+[\\.\\)]\\s*/, ''))}</li>`;
                    } else {
                        textHtml += `<p class="pptx-text">${escapeHtml(text)}</p>`;
                    }
                }
            }
        }

        // Render images
        for (const img of slide.images) {
            mediaHtml += `<div class="pptx-image-wrapper">
                <img src="data:${img.contentType};base64,${img.data}" alt="Slide ${i + 1}" loading="lazy" />
            </div>`;
        }

        // Render embedded media files (video/audio inside the pptx)
        for (const media of slide.mediaFiles) {
            const ct = media.contentType;
            if (ct.startsWith('video/')) {
                mediaHtml += `<div class="pptx-video-direct">
                    <video controls preload="metadata">
                        <source src="data:${ct};base64,${media.data}" type="${ct}">
                        Trình duyệt không hỗ trợ video.
                    </video>
                </div>`;
            } else if (ct.startsWith('audio/')) {
                mediaHtml += audioUrlToEmbedHtml('', media.data, ct);
            }
        }

        // Render external video URLs
        for (const url of slide.videoUrls) {
            if (url.startsWith('http')) {
                mediaHtml += videoUrlToEmbedHtml(url);
            }
        }

        // Render external audio URLs
        for (const url of slide.audioUrls) {
            if (url.startsWith('http')) {
                mediaHtml += audioUrlToEmbedHtml(url);
            }
        }

        if (textHtml && mediaHtml) {
            html += `<div class="pptx-grid-layout"><div class="pptx-grid-text">${textHtml}</div><div class="pptx-grid-media">${mediaHtml}</div></div>`;
        } else {
            html += textHtml + mediaHtml;
        }

        html += `</div></div>`; // close pptx-slide-content & pptx-slide
    }

    html += `</div>`; // close pptx-slides-wrapper

    // Slide navigation indicators at the bottom
    html += `<div class="pptx-nav-bar" style="justify-content: center;">
        <div class="pptx-nav-controls">
            <button class="pptx-nav-btn pptx-prev" disabled>‹ Trước</button>
            <span class="pptx-slide-counter">Trang <span class="pptx-current-num">1</span> / ${slides.length}</span>
            <button class="pptx-nav-btn pptx-next">Tiếp ›</button>
        </div>
    </div>`;

    html += `</div>`; // close pptx-presentation

    return html;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
