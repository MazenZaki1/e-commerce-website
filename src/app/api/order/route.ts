import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { getUserFromToken } from '~/lib/auth';

// GET /api/order - Get user's orders (or all orders for admin)
export async function GET(req: Request) {
    try {
        const { userId, role } = await getUserFromToken(req);
        let orders;
        if (role === 'ADMIN') {
            // Admin can see all orders
            orders = await db.order.findMany({
                include: {
                    user: {
                        select: {
                            user_id: true,
                            email: true,
                            first_name: true,
                            last_name: true
                        }
                    },
                    orderItems: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            // Regular users can only see their own orders
            orders = await db.order.findMany({
                where: { user_id: userId },
                include: {
                    orderItems: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

// POST /api/order - Create order from cart
export async function POST(req: Request) {
    try {
        const { userId } = await getUserFromToken(req);
        
        // Get user's cart with items
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

        if (!cart || cart.cartItems.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // Calculate total amount
        const totalAmount = cart.cartItems.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);

        // Create order with transaction
        const order = await db.$transaction(async (prisma) => {
            // Create order
            const newOrder = await prisma.order.create({
                data: {
                    user_id: userId,
                    total_amount: totalAmount,
                    status: 'pending'
                }
            });

            // Create order items
            await Promise.all(
                cart.cartItems.map(item =>
                    prisma.orderItem.create({
                        data: {
                            order_id: newOrder.order_id,
                            product_id: item.product_id,
                            quantity: item.quantity,
                            price: item.product.price
                        }
                    })
                )
            );

            // Clear cart
            await prisma.cartItem.deleteMany({
                where: { cart_id: cart.cart_id }
            });

            return newOrder;
        });

        // Fetch complete order with items
        const completeOrder = await db.order.findUnique({
            where: { order_id: order.order_id },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                }
            }
        });

        return NextResponse.json(completeOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
} 