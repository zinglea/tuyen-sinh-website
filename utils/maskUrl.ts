export function maskSupabaseUrl(url: string | null): string | null {
    if (!url) return url;
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (baseUrl && url.includes(baseUrl)) {
        return url.replace(new RegExp(`${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/storage/v1/object/public/`, 'g'), '/api/file?path=');
    }
    return url;
}
