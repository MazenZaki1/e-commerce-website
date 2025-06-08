import { jwtVerify } from "jose";

// Get user from token
export async function getUserFromToken(req: Request): Promise<{ userId: number; role: string }> {
    let token = req.headers.get('authorization')?.split(' ')[1];
    token = token?.replace('"', '').replace(',', '');
    if (!token) {
        throw new Error('Unauthorized, token not found!');
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'default_secret');
    const { payload } = await jwtVerify(token, secret);
    return {
        userId: payload.user_id as number,
        role: payload.role as string
    };
} 