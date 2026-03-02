import { createClient } from './server'

// ===================== NEWS =====================
export interface SupabaseNewsItem {
    id: string
    title: string
    content: string | null
    image_url: string | null
    author: string
    category: string | null
    created_at: string
}

export async function getSupabaseNews(): Promise<SupabaseNewsItem[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching Supabase news:', error.message)
            return []
        }
        return data || []
    } catch (e) {
        console.error('Supabase news fetch failed:', e)
        return []
    }
}

// ===================== DOCUMENTS =====================
export interface SupabaseDocument {
    id: string
    title: string
    file_url: string
    file_type: string | null
    category: string | null
    created_at: string
}

export async function getSupabaseDocuments(): Promise<SupabaseDocument[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching Supabase documents:', error.message)
            return []
        }
        return data || []
    } catch (e) {
        console.error('Supabase documents fetch failed:', e)
        return []
    }
}
