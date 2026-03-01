import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

// Auto-reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env
const redis = Redis.fromEnv()

// Keys in Redis
const TOTAL_KEY = 'stats:total'
const TODAY_COUNT_KEY = 'stats:today_count'
const TODAY_DATE_KEY = 'stats:today_date'
const ONLINE_PREFIX = 'online:'

export async function GET() {
    try {
        const total = (await redis.get<number>(TOTAL_KEY)) || 0
        const todayDate = await redis.get<string>(TODAY_DATE_KEY)
        const today = new Date().toDateString()

        let todayCount = 0
        if (todayDate === today) {
            todayCount = (await redis.get<number>(TODAY_COUNT_KEY)) || 0
        }

        // Count online users (keys with online: prefix that haven't expired)
        const onlineKeys = await redis.keys(ONLINE_PREFIX + '*')
        const onlineCount = onlineKeys.length

        return NextResponse.json({
            totalVisitors: total,
            todayViews: todayCount,
            onlineNow: Math.max(1, onlineCount)
        })
    } catch (e) {
        console.error('Stats GET error:', e)
        return NextResponse.json({
            totalVisitors: 0,
            todayViews: 0,
            onlineNow: 1
        })
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action')
        const sessionId = searchParams.get('session') || 'anon-' + Date.now()

        const today = new Date().toDateString()
        const savedDate = await redis.get<string>(TODAY_DATE_KEY)

        // Reset daily counter if new day
        if (savedDate !== today) {
            await redis.set(TODAY_DATE_KEY, today)
            await redis.set(TODAY_COUNT_KEY, 0)
        }

        if (action === 'new_visit') {
            await redis.incr(TOTAL_KEY)
            await redis.incr(TODAY_COUNT_KEY)
        }

        // Mark this session as online (auto-expires in 5 minutes = 300 seconds)
        await redis.set(ONLINE_PREFIX + sessionId, 1, { ex: 300 })

        // Get current counts
        const total = (await redis.get<number>(TOTAL_KEY)) || 0
        const todayCount = (await redis.get<number>(TODAY_COUNT_KEY)) || 0
        const onlineKeys = await redis.keys(ONLINE_PREFIX + '*')

        return NextResponse.json({
            success: true,
            totalVisitors: total,
            todayViews: todayCount,
            onlineNow: Math.max(1, onlineKeys.length)
        })
    } catch (e) {
        console.error('Stats POST error:', e)
        return NextResponse.json({ error: 'Cannot update stats' }, { status: 500 })
    }
}
