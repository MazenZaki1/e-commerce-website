import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs'; // Ensure bcryptjs is installed
const prisma = new PrismaClient();

interface RegistrationData {
    email: string;
    password: string;
}

export async function POST(req: Request) {
    try {
        const { email, password }: RegistrationData = await req.json() as RegistrationData;
        
        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const doesUserExist = await prisma.user.findUnique({
            where: { email },
        });

        if (doesUserExist) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await hash(password, 10); // Hash the password before storing it

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword, // Store the hashed password
            },
        });

        return NextResponse.json({ newUser, success: true, message: 'Registration successful' }, { status: 201 });
    }
    catch (error) {
        console.error('Error processing registration:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}   