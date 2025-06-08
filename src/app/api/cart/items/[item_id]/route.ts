import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { getUserFromToken } from '~/lib/auth';

interface UpdateCartItemData {
    quantity: number;
}

// PUT /api/cart/items/[item_id] - Update cart item quantity
export async function PUT(req: Request, { params }: { params: Promise<{ item_id: string }> }) {
    try {
        const { item_id } = await params;
        const { userId } = await getUserFromToken(req);
        const { quantity }: UpdateCartItemData = await req.json() as UpdateCartItemData;

        if (!quantity || quantity <= 0) {
            return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
        }

        // Verify the cart item belongs to the user
        const cartItem = await db.cartItem.findUnique({
            where: { cart_item_id: parseInt(item_id) },
            include: {
                cart: true,
                product: true
            }
        });

        if (!cartItem) {
            return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
        }

        if (cartItem.cart.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Update quantity
        const updatedItem = await db.cartItem.update({
            where: { cart_item_id: parseInt(item_id) },
            data: { quantity },
            include: { product: true }
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error('Error updating cart item:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

// DELETE /api/cart/items/[item_id] - Remove item from cart
export async function DELETE(req: Request, { params }: { params: Promise<{ item_id: string }> }) {
    try {
        const { item_id } = await params;
        const { userId } = await getUserFromToken(req);

        // Verify the cart item belongs to the user
        const cartItem = await db.cartItem.findUnique({
            where: { cart_item_id: parseInt(item_id) },
            include: { cart: true }
        });

        if (!cartItem) {
            return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
        }

        if (cartItem.cart.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Delete the cart item
        await db.cartItem.delete({
            where: { cart_item_id: parseInt(item_id) }
        });

        return NextResponse.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Error removing cart item:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
} 