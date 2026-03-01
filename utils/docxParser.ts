import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { parsePptx } from './pptxParser';


const NEWS_DIR = path.join(process.cwd(), 'data/news');

export interface NewsArticle {
    id: string;
    slug: string;
    title: string;
    category: string;
    excerpt: string;
    date: string;
    contentHtml: string;
    image?: string;
    author?: string;
    contentType?: 'docx' | 'pptx';
}

/**
 * Extract YouTube/video URLs from docx internal relationships (OLE embeds) or direct media files
 */
async function extractVideoUrlsFromDocx(filePath: string): Promise<string[]> {
    const urls: string[] = [];

    try {
        // Read docx as zip buffer
        const buffer = fs.readFileSync(filePath);

        // Simple zip parsing: find document.xml.rels which contains hyperlinks
        // DOCX is a ZIP file, we search for the rels content
        const bufStr = buffer.toString('binary');

        // Find YouTube/video URLs in the binary content
        const urlPatterns = [
            /https?:\/\/(?:www\.)?youtube\.com\/(?:embed\/|watch\?v=|v\/)([\w-]+)[^\s"<']*/g,
            /https?:\/\/youtu\.be\/([\w-]+)[^\s"<']*/g,
            /https?:\/\/(?:www\.)?facebook\.com\/.*\/videos\/\d+[^\s"<']*/g,
            /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/\d+[^\s"<']*/g,
            /https?:\/\/[^\s"<']*\.mp4[^\s"<']*/g,
        ];

        for (const pattern of urlPatterns) {
            let match;
            while ((match = pattern.exec(bufStr)) !== null) {
                const url = match[0].replace(/[^\x20-\x7E]/g, ''); // Clean non-printable chars
                if (!urls.includes(url)) {
                    urls.push(url);
                }
            }
        }

        // Also extract embedded local video files using JSZip
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(buffer);
        const mediaFiles = Object.keys(zip.files).filter(name => name.startsWith('word/media/') && (name.toLowerCase().endsWith('.mp4') || name.toLowerCase().endsWith('.webm')));

        for (const mediaPath of mediaFiles) {
            const mediaFile = zip.file(mediaPath);
            if (mediaFile) {
                const mediaData = await mediaFile.async('base64');
                const ext = path.extname(mediaPath).toLowerCase();
                const mimeType = ext === '.webm' ? 'video/webm' : 'video/mp4';
                urls.push(`data:${mimeType};base64,${mediaData}`);
            }
        }
    } catch (error) {
        console.error(`Error extracting video URLs from ${filePath}:`, error);
    }

    return urls;
}

/**
 * Extract video URLs from raw text using custom tags
 * Supports: #Video: URL, #video: URL
 */
function extractVideoUrlsFromText(text: string): string[] {
    const urls: string[] = [];

    // Custom tag: #Video: URL
    const videoTagPattern = /#[Vv]ideo:\s*(https?:\/\/[^\s]+)/g;
    let match;
    while ((match = videoTagPattern.exec(text)) !== null) {
        urls.push(match[1]);
    }

    // Also detect plain YouTube URLs in text
    const youtubePattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/g;
    while ((match = youtubePattern.exec(text)) !== null) {
        const fullUrl = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
        if (!urls.includes(fullUrl)) {
            urls.push(fullUrl);
        }
    }

    return urls;
}

/**
 * Convert a video URL to an embeddable iframe HTML
 */
function videoUrlToEmbed(url: string): string {
    // YouTube
    let videoId = '';
    const ytMatch = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|v\/)|youtu\.be\/)([\w-]+)/);
    if (ytMatch) {
        videoId = ytMatch[1];
        return `
        <div class="video-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1.5em 0;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
            <iframe 
                src="https://www.youtube.com/embed/${videoId}" 
                style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:12px;"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                loading="lazy"
                title="Video YouTube">
            </iframe>
        </div>`;
    }

    // Facebook video
    if (url.includes('facebook.com') && url.includes('video')) {
        return `
        <div class="video-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1.5em 0;border-radius:12px;">
            <iframe 
                src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false" 
                style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:12px;"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" 
                allowfullscreen
                loading="lazy"
                title="Video Facebook">
            </iframe>
        </div>`;
    }

    // Direct MP4 or Base64 embedded video
    if (url.endsWith('.mp4') || url.includes('.mp4') || url.startsWith('data:video/')) {
        const mimeType = url.startsWith('data:video/webm') ? 'video/webm' : 'video/mp4';
        return `
        <div class="video-container" style="max-width:100%;margin:1.5em 0;height:auto;padding-bottom:0;">
            <video controls style="width:100%;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);" preload="metadata">
                <source src="${url}" type="${mimeType}">
                Trình duyệt không hỗ trợ video.
            </video>
        </div>`;
    }

    // Generic: link
    return `
    <div style="margin:1.5em 0;padding:1em;background:#f0f4ff;border-radius:12px;text-align:center;">
        <a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#1e40af;font-weight:bold;">
            🎬 Xem video tại đây
        </a>
    </div>`;
}

/**
 * Post-process HTML to handle video-related content
 * - Remove OLE video thumbnail images (EMF rendered as images)  
 * - Add video iframe embeds
 */
function processVideoInHtml(html: string, videoUrls: string[]): string {
    if (videoUrls.length === 0) return html;

    let remainingEmbeds: string[] = [];

    for (const url of videoUrls) {
        const embedHtml = videoUrlToEmbed(url);

        if (url.startsWith('data:video/')) {
            remainingEmbeds.push(embedHtml);
            continue;
        }

        const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let replaced = false;

        // Pattern 1: <p> tag containing #Video: url
        const pWithTag = new RegExp(`<p[^>]*>.*?#[Vv]ideo:\\s*(?:<a[^>]*>)?${escapedUrl}(?:<\\/a>)?.*?<\\/p>`, 'i');
        if (pWithTag.test(html)) {
            html = html.replace(pWithTag, embedHtml);
            replaced = true;
        } else {
            // Pattern 2: <p> tag matching standalone url
            const pWithUrl = new RegExp(`<p[^>]*>\\s*(?:<a[^>]*>)?${escapedUrl}(?:<\\/a>)?\\s*<\\/p>`, 'i');
            if (pWithUrl.test(html)) {
                html = html.replace(pWithUrl, embedHtml);
                replaced = true;
            }
        }

        if (!replaced) {
            remainingEmbeds.push(embedHtml);
        }
    }

    if (remainingEmbeds.length > 0) {
        const remainingEmbedsHtml = remainingEmbeds.join('\n');
        const oleImagePattern = /(<p[^>]*>)?\s*<img[^>]+src="data:image\/[^"]*"[^>]*>\s*(<\/p>)?/;
        const oleMatch = html.match(oleImagePattern);

        if (oleMatch) {
            html = html.replace(oleImagePattern, remainingEmbedsHtml);
        } else {
            html += '\n' + remainingEmbedsHtml;
        }
    }

    return html;
}

export async function getAllNews(): Promise<NewsArticle[]> {
    if (!fs.existsSync(NEWS_DIR)) {
        return [];
    }

    const allFiles = fs.readdirSync(NEWS_DIR).filter(file => !file.startsWith('~'));
    const docxFiles = allFiles.filter(file => file.endsWith('.docx'));
    const pptxFiles = allFiles.filter(file => file.endsWith('.pptx'));

    const articles: NewsArticle[] = [];

    // Process DOCX files
    for (const file of docxFiles) {
        const filePath = path.join(NEWS_DIR, file);
        const fileNameWithoutExt = path.basename(file, '.docx');

        const slug = fileNameWithoutExt
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        const stat = fs.statSync(filePath);
        let date = stat.mtime.toISOString();

        try {
            const options = {
                convertImage: mammoth.images.imgElement(function (image) {
                    return image.read("base64").then(function (imageBuffer) {
                        return {
                            src: "data:" + image.contentType + ";base64," + imageBuffer
                        };
                    });
                })
            };

            const result = await mammoth.convertToHtml({ path: filePath }, options);
            let html = result.value;

            const textResult = await mammoth.extractRawText({ path: filePath });
            const rawText = textResult.value.trim();

            // Extract metadata tags
            const categoryMatch = rawText.match(/#Loaivb:\s*(.*)/i);
            const titleMatch = rawText.match(/#Tieude:\s*(.*)/i);
            const authorMatch = rawText.match(/#Tacgia:\s*(.*)/i);
            const dateMatch = rawText.match(/#Ngay:\s*(.*)/i);

            let category = categoryMatch ? categoryMatch[1].trim() : 'Tin Tức';
            let title = titleMatch ? titleMatch[1].trim() : fileNameWithoutExt;
            let author = authorMatch ? authorMatch[1].trim() : 'Ban Biên Tập';

            // Parse date from #Ngay: tag (formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
            if (dateMatch) {
                const dateStr = dateMatch[1].trim();
                const dmyMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                if (dmyMatch) {
                    const [, d, m, y] = dmyMatch;
                    date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toISOString();
                } else {
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) date = parsed.toISOString();
                }
            }

            let cleanExcerptText = rawText.replace(/#Loaivb:.*|#Tieude:.*|#Tacgia:.*|#Ngay:.*|#Video:.*|#n[ộoiỉ]\s*dung:.*/gi, '')
                .replace(/https?:\/\/[^\s]+/g, '')
                .replace(/Có vẻ là.*?Không chạy được/gi, '')
                .trim();
            const excerpt = cleanExcerptText.substring(0, 150) + (cleanExcerptText.length > 150 ? '...' : '');

            // Find main image
            let mainImage = '/news-placeholder.jpg';
            const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
            for (const ext of extensions) {
                if (fs.existsSync(path.join(NEWS_DIR, `${fileNameWithoutExt}${ext}`))) {
                    mainImage = `/api/news-image/${fileNameWithoutExt}${ext}`;
                    break;
                }
            }

            if (mainImage === '/news-placeholder.jpg') {
                const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch && imgMatch[1]) {
                    mainImage = imgMatch[1];
                }
            }

            // Extract video URLs from docx internals AND from text content
            const docxVideoUrls = await extractVideoUrlsFromDocx(filePath);
            const textVideoUrls = extractVideoUrlsFromText(rawText);
            const allVideoUrls = docxVideoUrls.concat(textVideoUrls).filter((url, i, arr) => arr.indexOf(url) === i);

            // If still no image but we have a YouTube video, use its thumbnail
            if (mainImage === '/news-placeholder.jpg' && allVideoUrls.length > 0) {
                for (const url of allVideoUrls) {
                    const ytMatch = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|v\/)|youtu\.be\/)([\w-]+)/);
                    if (ytMatch) {
                        mainImage = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
                        break;
                    }
                }
            }

            if (allVideoUrls.length > 0) {
                console.log(`📹 ${file}: Found ${allVideoUrls.length} video(s):`, allVideoUrls);
            }

            // Process videos in HTML
            html = processVideoInHtml(html, allVideoUrls);

            // Remove ALL metadata tags from HTML
            const metaTags = ['#Loaivb:', '#Tieude:', '#Tacgia:', '#Ngay:', '#Video:'];
            for (const tag of metaTags) {
                const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                html = html.replace(new RegExp('<p[^>]*>.*?' + escaped + '.*?<\\/p>', 'ig'), '');
                html = html.replace(new RegExp('<h[1-6][^>]*>.*?' + escaped + '.*?<\\/h[1-6]>', 'ig'), '');
            }
            html = html.replace(/<p[^>]*>.*?#n[ộoiỉ]\s*dung:.*?<\/p>/ig, '');
            html = html.replace(/<h[1-6][^>]*>.*?#n[ộoiỉ]\s*dung:.*?<\/h[1-6]>/ig, '');

            articles.push({
                id: slug,
                slug,
                title,
                category,
                excerpt,
                date,
                contentHtml: html,
                image: mainImage,
                author,
                contentType: 'docx',
            });
        } catch (e) {
            console.error(`Error parsing docx ${file}:`, e);
        }
    }

    // Process PPTX files
    for (const file of pptxFiles) {
        const filePath = path.join(NEWS_DIR, file);
        const fileNameWithoutExt = path.basename(file, '.pptx');

        const slug = fileNameWithoutExt
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
            + '-pptx';

        const stat = fs.statSync(filePath);
        let date = stat.mtime.toISOString();

        try {
            const pptxResult = await parsePptx(filePath);

            // Extract metadata tags from PPTX raw text (same format as docx)
            const rawText = pptxResult.rawText;
            const categoryMatch = rawText.match(/#Loaivb:\s*(.*)/i);
            const titleMatch = rawText.match(/#Tieude:\s*(.*)/i);
            const authorMatch = rawText.match(/#Tacgia:\s*(.*)/i);
            const dateMatch = rawText.match(/#Ngay:\s*(.*)/i);

            let category = categoryMatch ? categoryMatch[1].trim() : 'Trình bày';
            let title = titleMatch ? titleMatch[1].trim() : pptxResult.title || fileNameWithoutExt;
            let author = authorMatch ? authorMatch[1].trim() : 'Ban Biên Tập';

            if (dateMatch) {
                const dateStr = dateMatch[1].trim();
                const dmyMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                if (dmyMatch) {
                    const [, d, m, y] = dmyMatch;
                    date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toISOString();
                } else {
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) date = parsed.toISOString();
                }
            }

            let cleanExcerptText = rawText.replace(/#Loaivb:.*|#Tieude:.*|#Tacgia:.*|#Ngay:.*|#Video:.*|#n[ộoiỉ]\s*dung:.*/gi, '')
                .replace(/https?:\/\/[^\s]+/g, '')
                .replace(/Có vẻ là.*?Không chạy được/gi, '')
                .trim();
            const excerpt = cleanExcerptText.substring(0, 150) + (cleanExcerptText.length > 150 ? '...' : '');

            // Find main image (external image file next to the pptx)
            let mainImage = '/news-placeholder.jpg';
            const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
            for (const ext of extensions) {
                if (fs.existsSync(path.join(NEWS_DIR, `${fileNameWithoutExt}${ext}`))) {
                    mainImage = `/api/news-image/${fileNameWithoutExt}${ext}`;
                    break;
                }
            }

            // If no external image, try to use first slide image as thumbnail
            if (mainImage === '/news-placeholder.jpg' && pptxResult.slides.length > 0) {
                const firstSlide = pptxResult.slides[0];
                if (firstSlide.images.length > 0) {
                    mainImage = `data:${firstSlide.images[0].contentType};base64,${firstSlide.images[0].data}`;
                }
            }

            // If still no image but we have a YouTube video, use its thumbnail
            if (mainImage === '/news-placeholder.jpg') {
                const allPptxVideoUrls = pptxResult.slides.flatMap(s => s.videoUrls);
                for (const url of allPptxVideoUrls) {
                    const ytMatch = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|v\/)|youtu\.be\/)([\w-]+)/);
                    if (ytMatch) {
                        mainImage = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
                        break;
                    }
                }
            }

            console.log(`📊 ${file}: Parsed ${pptxResult.slideCount} slides`);

            articles.push({
                id: slug,
                slug,
                title,
                category,
                excerpt: excerpt || '',
                date,
                contentHtml: pptxResult.html,
                image: mainImage,
                author,
                contentType: 'pptx',
            });
        } catch (e) {
            console.error(`Error parsing pptx ${file}:`, e);
        }
    }

    return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
    const allNews = await getAllNews();
    return allNews.find(article => article.slug === slug) || null;
}
