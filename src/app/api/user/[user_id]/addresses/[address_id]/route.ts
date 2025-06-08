import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { getUserFromToken } from '~/lib/auth';

interface UpdateAddressData {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}

// GET /api/user/[user_id]/addresses/[address_id] - Get specific address
export async function GET(req: Request, { params }: { params: Promise<{ user_id: string; address_id: string }> }) {
    try {
        const { user_id, address_id } = await params;
        const { userId, role } = await getUserFromToken(req);
        
        const targetUserId = parseInt(user_id);
        const targetAddressId = parseInt(address_id);
        
        // Check authorization
        if (role !== 'ADMIN' && userId !== targetUserId) {
            return NextResponse.json({ error: 'Unauthorized - Cannot access other user addresses' }, { status: 403 });
        }

        // Get the specific address
        const address = await db.address.findUnique({
            where: { address_id: targetAddressId },
            include: {
                user: {
                    select: {
                        user_id: true,
                        email: true,
                        first_name: true,
                        last_name: true
                    }
                }
            }
        });

        if (!address) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        // Verify the address belongs to the specified user
        if (address.user_id !== targetUserId) {
            return NextResponse.json({ error: 'Address does not belong to this user' }, { status: 400 });
        }

        return NextResponse.json(address);
    } catch (error) {
        console.error('Error fetching address:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

// PUT /api/user/[user_id]/addresses/[address_id] - Update specific address
export async function PUT(req: Request, { params }: { params: Promise<{ user_id: string; address_id: string }> }) {
    try {
        const { user_id, address_id } = await params;
        const { userId, role } = await getUserFromToken(req);
        const updateData: UpdateAddressData = await req.json() as UpdateAddressData;
        
        const targetUserId = parseInt(user_id);
        const targetAddressId = parseInt(address_id);
        
        // Check authorization
        if (role !== 'ADMIN' && userId !== targetUserId) {
            return NextResponse.json({ error: 'Unauthorized - Cannot update other user addresses' }, { status: 403 });
        }

        // Verify address exists and belongs to the user
        const existingAddress = await db.address.findUnique({
            where: { address_id: targetAddressId }
        });

        if (!existingAddress) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        if (existingAddress.user_id !== targetUserId) {
            return NextResponse.json({ error: 'Address does not belong to this user' }, { status: 400 });
        }

        // Filter out undefined values
        const filteredUpdateData = Object.fromEntries(
            Object.entries(updateData).filter(([, value]) => value !== undefined)
        );

        if (Object.keys(filteredUpdateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        // Update the address
        const updatedAddress = await db.address.update({
            where: { address_id: targetAddressId },
            data: filteredUpdateData
        });

        return NextResponse.json(updatedAddress);
    } catch (error) {
        console.error('Error updating address:', error);
        return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
    }
}

// DELETE /api/user/[user_id]/addresses/[address_id] - Delete specific address
export async function DELETE(req: Request, { params }: { params: Promise<{ user_id: string; address_id: string }> }) {
    try {
        const { user_id, address_id } = await params;
        const { userId, role } = await getUserFromToken(req);
        
        const targetUserId = parseInt(user_id);
        const targetAddressId = parseInt(address_id);
        
        // Check authorization
        if (role !== 'ADMIN' && userId !== targetUserId) {
            return NextResponse.json({ error: 'Unauthorized - Cannot delete other user addresses' }, { status: 403 });
        }

        // Verify address exists and belongs to the user
        const existingAddress = await db.address.findUnique({
            where: { address_id: targetAddressId }
        });

        if (!existingAddress) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        if (existingAddress.user_id !== targetUserId) {
            return NextResponse.json({ error: 'Address does not belong to this user' }, { status: 400 });
        }

        // Delete the address
        await db.address.delete({
            where: { address_id: targetAddressId }
        });

        return NextResponse.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
    }
} 