import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define protected routes
const protectedRoutes = ['/dashboard', '/profile', '/admin'];
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Get token from Authorization header or cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    // Fallback to cookie if no Authorization header
    token ??= request.cookies.get('token')?.value;
    
    // Check if current path is protected
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    
    // If accessing protected route
    if (isProtectedRoute) {
        if (!token) {
            // No token, redirect to login
            return NextResponse.redirect(new URL('/login', request.url));
        }
        
        try {
            // Verify token
            const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'default_secret');
            const { payload } = await jwtVerify(token, secret);
            
            // Optional: Check if token is blacklisted
            // if (await isTokenBlacklisted(token)) {
            //     return NextResponse.redirect(new URL('/login', request.url));
            // }
            
            // Add user info to headers for the route handler
            const response = NextResponse.next();
            response.headers.set('x-user-id', payload.user_id as string);
            response.headers.set('x-user-email', payload.email as string);
            
            return response;
            
        } catch (error) {
            // Invalid token, redirect to login
            console.log('Invalid token in middleware:', error);
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }
    
    // If accessing auth routes while logged in, redirect to dashboard
    if (isAuthRoute && token) {
        try {
            // Verify token is still valid
            const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'default_secret');
            await jwtVerify(token, secret);
            
            // Valid token, redirect to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch (error) {
            // Invalid token, allow access to auth routes
            console.log('Invalid token, allowing access to auth route:', error);
        }
    }
    
    return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}; 