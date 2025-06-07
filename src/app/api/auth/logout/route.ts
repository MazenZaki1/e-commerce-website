import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Optional: Token blacklist implementation (for production use)
// You could store blacklisted tokens in Redis, database, or in-memory cache
// const blacklistedTokens = new Set<string>(); // Simple in-memory example
// 
// async function addTokenToBlacklist(token: string, exp: number) {
//     blacklistedTokens.add(token);
//     // Set cleanup timeout for expired tokens
//     setTimeout(() => blacklistedTokens.delete(token), (exp * 1000) - Date.now());
// }
//
// export async function isTokenBlacklisted(token: string): Promise<boolean> {
//     return blacklistedTokens.has(token);
// }

export async function POST(req: Request) {
    try {
        // Get the authorization header
        const authorization = req.headers.get('authorization');
        
        if (!authorization?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No valid authorization token provided' }, 
                { status: 401 }
            );
        }

        // Extract the token
        const token = authorization.split(' ')[1];
        
        if (!token) {
            return NextResponse.json(
                { error: 'Invalid token format' }, 
                { status: 401 }
            );
        }

        try {
            // Verify the token is valid before logout
            const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'default_secret');
            const { payload } = await jwtVerify(token, secret);
            
            // Token is valid, proceed with logout
            const userEmail = typeof payload.email === 'string' ? payload.email : 'unknown';
            console.log(`User ${userEmail} logged out at ${new Date().toISOString()}`);
            
            // In a production environment, you might want to:
            // 1. Add the token to a blacklist/revocation list
            // 2. Log the logout event
            // 3. Clear any server-side sessions if using hybrid approach
            
            // Optional: Add token to blacklist (you'd need to implement this)
            // await addTokenToBlacklist(token, payload.exp);
            
            return NextResponse.json(
                { 
                    success: true, 
                    message: 'Logout successful',
                    // Instruct client to clear token
                    clearToken: true
                }, 
                { 
                    status: 200,
                    // Clear HTTP-only cookie if you're using cookies
                    headers: {
                        'Set-Cookie': 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict'
                    }
                }
            );
            
        } catch (jwtError) {
            // Token is invalid or expired - still allow logout
            console.log('Invalid or expired token during logout:', jwtError);
            
            return NextResponse.json(
                { 
                    success: true, 
                    message: 'Logout successful (token was invalid/expired)',
                    clearToken: true
                }, 
                { 
                    status: 200,
                    headers: {
                        'Set-Cookie': 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict'
                    }
                }
            );
        }
        
    } catch (error) {
        console.error('Error during logout:', error);
        return NextResponse.json(
            { error: 'Logout failed' }, 
            { status: 500 }
        );
    }
}

// Optional: Handle GET request for logout (e.g., logout links)
export async function GET() {
    return NextResponse.json(
        { 
            message: 'Use POST method for logout',
            success: false 
        }, 
        { status: 405 }
    );
}

/*
 * USAGE EXAMPLES:
 * 
 * Frontend JavaScript/TypeScript:
 * 
 * // Client-side logout function
 * async function logout() {
 *     const token = localStorage.getItem('token'); // or wherever you store the token
 *     
 *     try {
 *         const response = await fetch('/api/auth/logout', {
 *             method: 'POST',
 *             headers: {
 *                 'Authorization': `Bearer ${token}`,
 *                 'Content-Type': 'application/json'
 *             }
 *         });
 *         
 *         const data = await response.json();
 *         
 *         if (data.success) {
 *             // Clear token from client storage
 *             localStorage.removeItem('token');
 *             // Redirect to login page
 *             window.location.href = '/login';
 *         }
 *     } catch (error) {
 *         console.error('Logout failed:', error);
 *         // Still clear token on client side
 *         localStorage.removeItem('token');
 *         window.location.href = '/login';
 *     }
 * }
 * 
 * // React component example:
 * const LogoutButton = () => {
 *     const handleLogout = async () => {
 *         await logout();
 *     };
 *     
 *     return <button onClick={handleLogout}>Logout</button>;
 * };
 */
