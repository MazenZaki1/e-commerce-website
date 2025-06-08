import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { getUserFromToken } from '~/lib/auth';

interface AddressData {
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

// GET /api/user/[user_id]/addresses - Get all addresses for a user
export async function GET(req: Request, { params }: { params: Promise<{ user_id: string }> }) {
    try {
        const { user_id } = await params;
        const { userId, role } = await getUserFromToken(req);
        
        const targetUserId = parseInt(user_id);
        
        // Check authorization - users can only access their own addresses, admins can access any
        if (role !== 'ADMIN' && userId !== targetUserId) {
            return NextResponse.json({ error: 'Unauthorized - Cannot access other user addresses' }, { status: 403 });
        }

        // Verify user exists
        const user = await db.user.findUnique({
            where: { user_id: targetUserId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get all addresses for the user
        const addresses = await db.address.findMany({
            where: { user_id: targetUserId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(addresses);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

// POST /api/user/[user_id]/addresses - Create new address for user
export async function POST(req: Request, { params }: { params: Promise<{ user_id: string }> }) {
    try {
        const { user_id } = await params;
        const { userId, role } = await getUserFromToken(req);
        const { address, city, state, zip, country }: AddressData = await req.json() as AddressData;
        
        const targetUserId = parseInt(user_id);
        
        // Check authorization - users can only create addresses for themselves, admins can create for any user
        if (role !== 'ADMIN' && userId !== targetUserId) {
            return NextResponse.json({ error: 'Unauthorized - Cannot create address for other users' }, { status: 403 });
        }

        // Validate required fields
        if (!address || !city || !state || !zip || !country) {
            return NextResponse.json({ error: 'All address fields are required' }, { status: 400 });
        }

        // Verify user exists
        const user = await db.user.findUnique({
            where: { user_id: targetUserId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Create new address
        const newAddress = await db.address.create({
            data: {
                user_id: targetUserId,
                address,
                city,
                state,
                zip,
                country
            }
        });

        return NextResponse.json(newAddress, { status: 201 });
    } catch (error) {
        console.error('Error creating address:', error);
        return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
    }
}
