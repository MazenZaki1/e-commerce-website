import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { getUserFromToken } from '~/lib/auth';

// GET /api/cart - Get user's cart with items
export async function GET(req: Request) {
    try {
        const { userId } = await getUserFromToken(req);
        
        const cart = await db.cart.findUnique({
            where: { user_id: userId },
            include: {
                cartItems: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!cart) {
            // Create cart if it doesn't exist
            const newCart = await db.cart.create({
                data: { user_id: userId },
                include: {
                    cartItems: {
                        include: {
                            product: true
                        }
                    }
                }
            });
            return NextResponse.json(newCart);
        }

        return NextResponse.json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

// DELETE /api/cart - Clear user's cart
export async function DELETE(req: Request) {
    try {
        const { userId } = await getUserFromToken(req);
        
        const cart = await db.cart.findUnique({
            where: { user_id: userId }
        });

        if (!cart) {
            return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
        }

        // Delete all cart items
        await db.cartItem.deleteMany({
            where: { cart_id: cart.cart_id }
        });

        return NextResponse.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
} 