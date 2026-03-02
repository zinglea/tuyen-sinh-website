import { NextResponse } from 'next/server'

// Try to use Upstash Redis if configured, otherwise fallback to in-memory
let redis: any = null
let useRedis = false

try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const { Redis } = require('@upstash/redis')
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })
        useRedis = true
    }
} catch (e) {
    // Upstash not available
}

// In-memory fallback (works for local dev, resets on restart)
const memoryStats = {
    total: 0,
    todayCount: 0,
    lastDate: new Date().toDateString(),
    onlineUsers: {} as Record<string, number>,
}

// --- Redis-based functions ---
async function getRedis() {
    const TOTAL_KEY = 'stats:total'
    const TODAY_COUNT_KEY = 'stats:today_count'
    const TODAY_DATE_KEY = 'stats:today_date'
    const ONLINE_PREFIX = 'online:'

    const total = (await redis.get(TOTAL_KEY)) || 0
    const todayDate = await redis.get(TODAY_DATE_KEY)
    const today = new Date().toDateString()
    let todayCount = 0
    if (todayDate === today) {
        todayCount = (await redis.get(TODAY_COUNT_KEY)) || 0
    }
    const onlineKeys = await redis.keys(ONLINE_PREFIX + '*')
    return { totalVisitors: total, todayViews: todayCount, onlineNow: Math.max(1, onlineKeys.length) }
}

async function postRedis(action: string | null, sessionId: string) {
    const TOTAL_KEY = 'stats:total'
    const TODAY_COUNT_KEY = 'stats:today_count'
    const TODAY_DATE_KEY = 'stats:today_date'
    const ONLINE_PREFIX = 'online:'

    const today = new Date().toDateString()
    const savedDate = await redis.get(TODAY_DATE_KEY)
    if (savedDate !== today) {
        await redis.set(TODAY_DATE_KEY, today)
        await redis.set(TODAY_COUNT_KEY, 0)
    }
    if (action === 'new_visit') {
        await redis.incr(TOTAL_KEY)
        await redis.incr(TODAY_COUNT_KEY)
    }
    await redis.set(ONLINE_PREFIX + sessionId, 1, { ex: 300 })
    const total = (await redis.get(TOTAL_KEY)) || 0
    const todayCount = (await redis.get(TODAY_COUNT_KEY)) || 0
    const onlineKeys = await redis.keys(ONLINE_PREFIX + '*')
    return { totalVisitors: total, todayViews: todayCount, onlineNow: Math.max(1, onlineKeys.length) }
}

// --- Memory-based functions ---
function getMemory() {
    const now = Date.now()
    const fiveMinAgo = now - 5 * 60 * 1000
    const onlineCount = Object.values(memoryStats.onlineUsers).filter(ts => ts > fiveMinAgo).length
    return {
        totalVisitors: memoryStats.total,
        todayViews: memoryStats.todayCount,
        onlineNow: Math.max(1, onlineCount),
    }
}

function postMemory(action: string | null, sessionId: string) {
    const today = new Date().toDateString()
    if (memoryStats.lastDate !== today) {
        memoryStats.lastDate = today
        memoryStats.todayCount = 0
    }
    if (action === 'new_visit') {
        memoryStats.total += 1
        memoryStats.todayCount += 1
    }
    memoryStats.onlineUsers[sessionId] = Date.now()
    // Prune old sessions
    const fiveMinAgo = Date.now() - 5 * 60 * 1000
    for (const sid in memoryStats.onlineUsers) {
        if (memoryStats.onlineUsers[sid] <= fiveMinAgo) delete memoryStats.onlineUsers[sid]
    }
    return {
        totalVisitors: memoryStats.total,
        todayViews: memoryStats.todayCount,
        onlineNow: Math.max(1, Object.keys(memoryStats.onlineUsers).length),
    }
}

// --- API Handlers ---
export async function GET() {
    try {
        const data = useRedis ? await getRedis() : getMemory()
        return NextResponse.json(data)
    } catch (e) {
        console.error('Stats GET error:', e)
        return NextResponse.json({ totalVisitors: 0, todayViews: 0, onlineNow: 1 })
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action')
        const sessionId = searchParams.get('session') || 'anon-' + Date.now()

        const data = useRedis
            ? await postRedis(action, sessionId)
            : postMemory(action, sessionId)

        return NextResponse.json({ success: true, ...data })
    } catch (e) {
        console.error('Stats POST error:', e)
        return NextResponse.json({ error: 'Cannot update stats' }, { status: 500 })
    }
}
