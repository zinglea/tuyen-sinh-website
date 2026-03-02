import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session (important for token rotation)
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protect /admin routes: redirect to /login if not authenticated
    if (request.nextUrl.pathname.startsWith('/admin') && !user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    // If user is logged in and visits /login, redirect to /admin
    if (request.nextUrl.pathname === '/login' && user) {
        return NextResponse.redirect(new URL('/admin', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/login',
    ],
}
