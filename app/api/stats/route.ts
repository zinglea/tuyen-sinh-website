import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DB_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DB_DIR, 'stats.json')

interface StatsData {
    total: number;
    todayCount: number;
    lastDate: string;
    firstVisit: number;
    onlineUsers: number[]; // Array of timestamps
}

// Ensure the directory and file exist
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
}

if (!fs.existsSync(DB_FILE)) {
    // Initial seeded data
    const initialData: StatsData = {
        total: 12450,
        todayCount: 142,
        lastDate: new Date().toDateString(),
        firstVisit: Date.now(),
        onlineUsers: []
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2))
}

export async function GET() {
    try {
        const dataStr = fs.readFileSync(DB_FILE, 'utf-8')
        const data: StatsData = JSON.parse(dataStr)

        // Clean up online users (older than 5 minutes)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
        const activeUsersCount = data.onlineUsers.filter(ts => ts > fiveMinutesAgo).length

        return NextResponse.json({
            totalVisitors: data.total,
            todayViews: data.todayCount,
            onlineNow: Math.max(1, activeUsersCount) // At least 1 (the requester)
        })
    } catch (e) {
        return NextResponse.json({ error: 'Cannot read stats' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action') // 'new_visit' or 'ping'
        const sessionId = searchParams.get('session') || Date.now().toString()

        const dataStr = fs.readFileSync(DB_FILE, 'utf-8')
        const data: StatsData = JSON.parse(dataStr)

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

        // Add or update timestamp for this pseudo-session using the end of array
        // In a real DB we'd use IP or distinct session IDs. Here we just add a timestamp and keep array small.
        data.onlineUsers.push(now)

        // Prune old timestamps to keep file small (5 min threshold)
        const fiveMinutesAgo = now - 5 * 60 * 1000
        data.onlineUsers = data.onlineUsers.filter(ts => ts > fiveMinutesAgo)

        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))

        return NextResponse.json({ success: true, online: data.onlineUsers.length, total: data.total, today: data.todayCount })

    } catch (e) {
        return NextResponse.json({ error: 'Cannot update stats' }, { status: 500 })
    }
}
