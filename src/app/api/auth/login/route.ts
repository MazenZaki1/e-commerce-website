import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose'; // Import jwt for token generation if needed


interface LoginData {
    email: string;
    password: string;
}

export async function POST(req: Request) {
    try {
        const { email, password }: LoginData = await req.json() as LoginData;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.password) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password); // Compare the provided password with the stored hashed password

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const token = await new SignJWT({
            user_id: user.user_id,
            email: user.email,
            role: user.role
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h') // Set token expiration time
            .sign(new TextEncoder().encode(process.env.JWT_SECRET ?? 'default_secret')); // Use your JWT secret

        return NextResponse.json({ user, token, success: true, message: 'Login successful' }, { status: 200 });
    } catch (error) {
        console.error('Error processing login:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}