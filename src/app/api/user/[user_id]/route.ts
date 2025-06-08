import { NextResponse } from 'next/server';
import { db } from '~/server/db';

export async function GET(req: Request, { params }: { params: Promise<{ user_id: string }> }) {
    const { user_id } = await params;
    const user = await db.user.findUnique({
        where: { user_id: parseInt(user_id) }
    });
    return NextResponse.json(user);
}

export async function PUT(req: Request, { params }: { params: Promise<{ user_id: string }> }) {
    const { user_id } = await params;
    const { first_name, last_name, email, password } = await req.json() as { first_name: string, last_name: string, email: string, password: string };
    const user = await db.user.update({
        where: { user_id: parseInt(user_id) },
        data: { first_name, last_name, email, password }
    });
    return NextResponse.json(user);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ user_id: string }> }) {
    const { user_id } = await params;
    const user = await db.user.delete({
        where: { user_id: parseInt(user_id) }
    });
    return NextResponse.json(user);
}