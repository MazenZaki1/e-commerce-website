import { NextResponse } from 'next/server';
import { db } from '~/server/db';

export async function GET() {
    const users = await db.user.findMany();
    return NextResponse.json(users);
}
