import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    try {
        const { type, id } = await request.json()

        if (!type || !id) {
            return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
        }

        const supabase = await createClient()

        if (type === 'news') {
            // Track view for news article
            // Rpc call or direct update for simplicity
            // We read the current value first, or use a Postgres function. 
            // In a real high-traffic app, an RPC increment function is better. 
            // For now, getting the row and adding 1 is simplest without writing new RPCs.
            const { data: currentData } = await supabase.from('news').select('views').eq('id', id).single()
            if (currentData !== null) {
                const currentViews = currentData.views || 0
                await supabase.from('news').update({ views: currentViews + 1 }).eq('id', id)
            }
        } else if (type === 'document') {
            // Track view for raw document
            const { data: currentData } = await supabase.from('documents').select('views').eq('id', id).single()
            if (currentData !== null) {
                const currentViews = currentData.views || 0
                await supabase.from('documents').update({ views: currentViews + 1 }).eq('id', id)
            }
        } else if (type === 'document_download') {
            // Track download for raw document
            const { data: currentData } = await supabase.from('documents').select('downloads').eq('id', id).single()
            if (currentData !== null) {
                const currentDl = currentData.downloads || 0
                await supabase.from('documents').update({ downloads: currentDl + 1 }).eq('id', id)
            }
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('Track View logic error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
