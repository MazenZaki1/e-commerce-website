import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { getUserFromToken } from '~/lib/auth';

interface CartItemData {
    product_id: number;
    quantity: number;
}

// POST /api/cart/items - Add item to cart
export async function POST(req: Request) {
    try {
        const { userId } = await getUserFromToken(req);
        const { product_id, quantity }: CartItemData = await req.json() as CartItemData;

        if (!product_id || !quantity || quantity <= 0) {
            return NextResponse.json({ error: 'Invalid product_id or quantity' }, { status: 400 });
        }

        // Get or create user's cart
        let cart = await db.cart.findUnique({
            where: { user_id: userId }
        });

        cart ??= await db.cart.create({
            data: { user_id: userId }
        });

        // Check if product exists
        const product = await db.product.findUnique({
            where: { product_id: product_id }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Check if item already exists in cart
        const existingItem = await db.cartItem.findFirst({
            where: {
                cart_id: cart.cart_id,
                product_id: product_id
            }
        });

        let cartItem;
        if (existingItem) {
            // Update quantity
            cartItem = await db.cartItem.update({
                where: { cart_item_id: existingItem.cart_item_id },
                data: { quantity: existingItem.quantity + quantity },
                include: { product: true }
            });
        } else {
            // Create new cart item
            cartItem = await db.cartItem.create({
                data: {
                    cart_id: cart.cart_id,
                    product_id,
                    quantity
                },
                include: { product: true }
            });
        }

        return NextResponse.json(cartItem);
    } catch (error) {
        console.error('Error adding item to cart:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

// GET /api/cart/items - Get all items in user's cart
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
            return NextResponse.json({ cartItems: [] });
        }

        return NextResponse.json(cart.cartItems);
    } catch (error) {
        console.error('Error fetching cart items:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
} 