import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// UserRole Enum (Local copy to avoid import issues in Edge Runtime)
const UserRole = {
    Admin: 0,
    Waiter: 1,
    Kitchen: 2,
    Cashier: 3
} as const;

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Public Paths
    if (pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/static')) {
        return NextResponse.next()
    }

    // Check Auth
    const token = request.cookies.get('auth_token')?.value;
    const roleStr = request.cookies.get('auth_role')?.value;

    if (!token || !roleStr) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    const role = parseInt(roleStr);

    // Admin Access All Areas
    if (role === 0) {
        return NextResponse.next();
    }

    // Role Based Guard
    // 0=Admin, 1=Waiter, 2=Kitchen, 3=Cashier

    // Admin Only
    if (pathname.startsWith('/admin')) {
        if (role !== 0) { // Not Admin
            return NextResponse.redirect(new URL('/', request.url)) // Redirect to POS or unauthorized
        }
    }

    // Kitchen Only (or Admin?)
    if (pathname.startsWith('/kitchen') || pathname.startsWith('/bar')) {
        if (role !== 2 && role !== 0) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // Cashier Only (or Admin?)
    if (pathname.startsWith('/cashier')) {
        if (role !== 3 && role !== 0) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
