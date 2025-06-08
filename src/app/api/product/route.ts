import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { getUserFromToken } from '~/lib/auth';

interface Product {
    category_id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    stock: number;
    sold_count: number;
    is_deleted: boolean;
}

export async function GET() {
    const products = await db.product.findMany({
        include: {
            category: {
                select: {
                    category_id: true,
                    name: true
                }
            }
        }
    });
    return NextResponse.json(products);
}

export async function POST(req: Request) {
    const { role } = await getUserFromToken(req) as { role: string };
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized, user is not an admin!' }, { status: 401 });
    }
    try {
        const { category_id, name, description, price, image_url, stock, sold_count, is_deleted }: Product = await req.json() as Product;
        const product = await db.product.create({
            data: { category_id, name, description, price, image_url, stock, sold_count, is_deleted },
        });
        return NextResponse.json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}

