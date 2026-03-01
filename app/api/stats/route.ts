import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Use /tmp on Vercel (writable), fallback to data/ locally
const isVercel = process.env.VERCEL === '1'
const DB_DIR = isVercel ? os.tmpdir() : path.join(process.cwd(), 'data')
const DB_FILE = path.join(DB_DIR, 'stats.json')

interface StatsData {
    total: number;
    todayCount: number;
    lastDate: string;
    onlineUsers: { [sessionId: string]: number }; // sessionId -> last ping timestamp
}

const SEED_DATA: StatsData = {
    total: 0,
    todayCount: 0,
    lastDate: new Date().toDateString(),
    onlineUsers: {}
}

function readStats(): StatsData {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf-8')
            return JSON.parse(raw)
        }
    } catch (e) { /* ignore */ }
    return { ...SEED_DATA }
}

function writeStats(data: StatsData): void {
    try {
        if (!fs.existsSync(DB_DIR)) {
            fs.mkdirSync(DB_DIR, { recursive: true })
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
    } catch (e) {
        console.error('Failed to write stats:', e)
    }
}

export async function GET() {
    const data = readStats()

    // Clean up online users (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    let activeCount = 0
    for (const sid in data.onlineUsers) {
        if (data.onlineUsers[sid] > fiveMinutesAgo) {
            activeCount++
        }
    }

    return NextResponse.json({
        totalVisitors: data.total,
        todayViews: data.todayCount,
        onlineNow: Math.max(1, activeCount)
    })
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action') // 'new_visit' or 'ping'
        const sessionId = searchParams.get('session') || 'anon-' + Date.now()

        const data = readStats()
        const today = new Date().toDateString()
        const now = Date.now()

        // Reset daily counter if new day
        if (data.lastDate !== today) {
            data.lastDate = today
            data.todayCount = 0
        }

        if (action === 'new_visit') {
            data.total += 1
            data.todayCount += 1
        }

        // Update online timestamp for this session
        data.onlineUsers[sessionId] = now

        // Prune sessions older than 5 minutes
        const fiveMinutesAgo = now - 5 * 60 * 1000
        for (const sid in data.onlineUsers) {
            if (data.onlineUsers[sid] <= fiveMinutesAgo) {
                delete data.onlineUsers[sid]
            }
        }

        writeStats(data)

        const onlineCount = Object.keys(data.onlineUsers).length

        return NextResponse.json({
            success: true,
            totalVisitors: data.total,
            todayViews: data.todayCount,
            onlineNow: Math.max(1, onlineCount)
        })

    } catch (e) {
        return NextResponse.json({ error: 'Cannot update stats' }, { status: 500 })
    }
}
