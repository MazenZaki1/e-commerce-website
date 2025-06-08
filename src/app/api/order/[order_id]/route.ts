import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { getUserFromToken } from '~/lib/auth';

interface UpdateOrderData {
    status: string;
}

// GET /api/order/[order_id] - Get specific order
export async function GET(req: Request, { params }: { params: Promise<{ order_id: string }> }) {
    try {
        const { order_id } = await params;
        const { userId, role } = await getUserFromToken(req);
        
        const order = await db.order.findUnique({
            where: { order_id: parseInt(order_id) },
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
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check if user can access this order
        if (role !== 'ADMIN' && order.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

// PUT /api/order/[order_id] - Update order status (admin only)
export async function PUT(req: Request, { params }: { params: Promise<{ order_id: string }> }) {
    try {
        const { order_id } = await params;
        const { role } = await getUserFromToken(req);
        const { status }: UpdateOrderData = await req.json() as UpdateOrderData;

        // Only admins can update order status
        if (role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        // Validate status
        const validStatuses = ['pending', 'completed', 'cancelled'];
        if (!validStatuses.includes(status.toLowerCase())) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const order = await db.order.findUnique({
            where: { order_id: parseInt(order_id) }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const updatedOrder = await db.order.update({
            where: { order_id: parseInt(order_id) },
            data: { status: status.toLowerCase() },
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
            }
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}

// DELETE /api/order/[order_id] - Cancel order (user) or delete order (admin)
export async function DELETE(req: Request, { params }: { params: Promise<{ order_id: string }> }) {
    try {
        const { order_id } = await params;
        const { userId, role } = await getUserFromToken(req);
        
        const order = await db.order.findUnique({
            where: { order_id: parseInt(order_id) }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check if user can delete this order
        if (role !== 'ADMIN' && order.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Users can only cancel pending orders, admins can delete any
        if (role !== 'ADMIN' && order.status !== 'pending') {
            return NextResponse.json({ error: 'Can only cancel pending orders' }, { status: 400 });
        }

        if (role === 'ADMIN') {
            // Admin: Delete order and order items
            await db.$transaction(async (prisma) => {
                await prisma.orderItem.deleteMany({
                    where: { order_id: parseInt(order_id) }
                });
                await prisma.order.delete({
                    where: { order_id: parseInt(order_id) }
                });
            });
            return NextResponse.json({ message: 'Order deleted successfully' });
        } else {
            // User: Cancel order
            const cancelledOrder = await db.order.update({
                where: { order_id: parseInt(order_id) },
                data: { status: 'cancelled' }
            });
            return NextResponse.json({ message: 'Order cancelled successfully', order: cancelledOrder });
        }
    } catch (error) {
        console.error('Error deleting/cancelling order:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
} 