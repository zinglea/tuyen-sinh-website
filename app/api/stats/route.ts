import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

async function getStats(supabase: any) {
    // Calculate today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Calculate dates for week and month boundaries
    const now = new Date()

    // Start of week (Monday)
    const dayOfWeek = now.getDay()
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // adjust when day is sunday
    const startOfWeek = new Date(now.setDate(diffToMonday)).toISOString().split('T')[0]

    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    // 1. Get online users (sessions active in last 5 minutes)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { count: onlineCount } = await supabase
        .from('visitor_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', fiveMinAgo)

    // 2. Get today's views
    const { data: todayData } = await supabase
        .from('visitor_stats')
        .select('views')
        .eq('date', today)
        .single()
    const todayViews = todayData?.views || 0

    // 3. Get total views
    const { data: allData } = await supabase
        .from('visitor_stats')
        .select('views')

    const totalVisitors = allData?.reduce((sum: number, row: any) => sum + (row.views || 0), 0) || 0

    // 4. Get this week's views
    const { data: weekData } = await supabase
        .from('visitor_stats')
        .select('views')
        .gte('date', startOfWeek)
    const weekViews = weekData?.reduce((sum: number, row: any) => sum + (row.views || 0), 0) || 0

    // 5. Get this month's views
    const { data: monthData } = await supabase
        .from('visitor_stats')
        .select('views')
        .gte('date', startOfMonth)
    const monthViews = monthData?.reduce((sum: number, row: any) => sum + (row.views || 0), 0) || 0

    return {
        onlineNow: Math.max(1, onlineCount || 1),
        todayViews,
        weekViews,
        monthViews,
        totalVisitors
    }
}

async function postStats(action: string | null, sessionId: string, supabase: any) {
    const today = new Date().toISOString().split('T')[0]

    // 1. Upsert session
    // We update last_active for the session
    const { data: existingSession } = await supabase
        .from('visitor_sessions')
        .select('session_id')
        .eq('session_id', sessionId)
        .single()

    if (existingSession) {
        await supabase
            .from('visitor_sessions')
            .update({ last_active: new Date().toISOString() })
            .eq('session_id', sessionId)
    } else {
        await supabase
            .from('visitor_sessions')
            .insert({ session_id: sessionId, last_active: new Date().toISOString() })
    }

    // 2. Increment stats if it's a new visit
    if (action === 'new_visit') {
        const { data: todayStats } = await supabase
            .from('visitor_stats')
            .select('views')
            .eq('date', today)
            .single()

        if (todayStats) {
            await supabase
                .from('visitor_stats')
                .update({ views: (todayStats.views || 0) + 1 })
                .eq('date', today)
        } else {
            await supabase
                .from('visitor_stats')
                .insert({ date: today, views: 1 })
        }
    }

    // Return current stats
    return await getStats(supabase)
}

export async function GET() {
    try {
        const supabase = await createClient()
        const data = await getStats(supabase)
        return NextResponse.json(data)
    } catch (e) {
        console.error('Stats GET error:', e)
        return NextResponse.json({ totalVisitors: 0, todayViews: 0, weekViews: 0, monthViews: 0, onlineNow: 1 })
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action')
        const sessionId = searchParams.get('session') || 'anon-' + Date.now()

        const supabase = await createClient()
        const data = await postStats(action, sessionId, supabase)

        return NextResponse.json({ success: true, ...data })
    } catch (e) {
        console.error('Stats POST error:', e)
        return NextResponse.json({ error: 'Cannot update stats' }, { status: 500 })
    }
}
