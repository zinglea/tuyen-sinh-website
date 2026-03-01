import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

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
}

export async function getAllNews(): Promise<NewsArticle[]> {
    if (!fs.existsSync(NEWS_DIR)) {
        return [];
    }

    const files = fs.readdirSync(NEWS_DIR).filter(file => file.endsWith('.docx') && !file.startsWith('~'));

    const articles: NewsArticle[] = [];

    for (const file of files) {
        const filePath = path.join(NEWS_DIR, file);
        const fileNameWithoutExt = path.basename(file, '.docx');

        const slug = fileNameWithoutExt
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        const stat = fs.statSync(filePath);
        const date = stat.mtime.toISOString();

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

            const categoryMatch = rawText.match(/#Loaivb:\s*(.*)/i);
            const titleMatch = rawText.match(/#Tieude:\s*(.*)/i);
            const authorMatch = rawText.match(/#Tacgia:\s*(.*)/i);

            let category = categoryMatch ? categoryMatch[1].trim() : 'Tin Tức';
            let title = titleMatch ? titleMatch[1].trim() : fileNameWithoutExt;
            let author = authorMatch ? authorMatch[1].trim() : 'Ban Biên Tập';

            const cleanExcerptText = rawText.replace(/#Loaivb:.*|#Tieude:.*|#Tacgia:.*|#n[ộoiỉ]\s*dung:.*/gi, '').trim();
            const excerpt = cleanExcerptText.substring(0, 150) + (cleanExcerptText.length > 150 ? '...' : '');

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

            html = html.replace(/<p[^>]*>.*?#Loaivb:.*?<\/p>/ig, '');
            html = html.replace(/<p[^>]*>.*?#Tieude:.*?<\/p>/ig, '');
            html = html.replace(/<p[^>]*>.*?#Tacgia:.*?<\/p>/ig, '');
            html = html.replace(/<p[^>]*>.*?#n[ộoiỉ]\s*dung:.*?<\/p>/ig, '');
            html = html.replace(/<h[1-6][^>]*>.*?#Loaivb:.*?<\/h[1-6]>/ig, '');
            html = html.replace(/<h[1-6][^>]*>.*?#Tieude:.*?<\/h[1-6]>/ig, '');
            html = html.replace(/<h[1-6][^>]*>.*?#Tacgia:.*?<\/h[1-6]>/ig, '');
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
                author
            });
        } catch (e) {
            console.error(`Error parsing docx ${file}:`, e);
        }
    }

    return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
    const allNews = await getAllNews();
    return allNews.find(article => article.slug === slug) || null;
}
