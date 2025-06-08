import { NextResponse } from "next/server";
import { db } from "~/server/db";

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

export async function GET(req: Request, { params }: { params: Promise<{ product_id: string }> }) {
    const { product_id } = await params;
    const product = await db.product.findUnique({ where: { product_id: parseInt(product_id) }, include: { category: { select: { category_id: true, name: true } } } });
    if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
}

export async function PUT(req: Request, { params }: { params: Promise<{ product_id: string }> }) {
    const { product_id } = await params;
    const { category_id, name, description, price, image_url, stock, sold_count, is_deleted }: Product = await req.json() as Product;
    const product = await db.product.update({ where: { product_id: parseInt(product_id) }, data: { category_id, name, description, price, image_url, stock, sold_count, is_deleted } });
    return NextResponse.json(product);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ product_id: string }> }) {
    const { product_id } = await params;
    const product = await db.product.delete({ where: { product_id: parseInt(product_id) } });
    return NextResponse.json(product);
}
