import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Declaration } from '@/lib/mongodb';

/**
 * POST /api/declarations/mark-executed
 * Mark a declaration as executed using its nonce (operator only)
 * Requires API token authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API token
    const authHeader = request.headers.get('authorization');
    const apiToken = process.env.OPERATOR_API_TOKEN;

    if (!apiToken) {
      console.error('OPERATOR_API_TOKEN not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${apiToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing API token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nonce, txHash } = body;

    // Validate nonce
    if (!nonce || typeof nonce !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid nonce' },
        { status: 400 }
      );
    }

    // Validate txHash (required for executed status)
    if (!txHash || !txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format (must be 0x + 64 hex characters)' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find declaration by nonce
    const declaration = await Declaration.findOne({ nonce });

    if (!declaration) {
      return NextResponse.json(
        { error: 'Declaration not found with this nonce' },
        { status: 404 }
      );
    }

    // Prevent updating already executed declarations
    if (declaration.status === 'executed') {
      return NextResponse.json(
        { error: 'Declaration already executed' },
        { status: 400 }
      );
    }

    // Check if declaration has expired
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (declaration.deadline < currentTimestamp) {
      return NextResponse.json(
        { error: 'Declaration has expired. Deadline has passed.' },
        { status: 400 }
      );
    }

    // Update declaration
    declaration.status = 'executed';
    declaration.txHash = txHash;
    declaration.executedAt = new Date();

    await declaration.save();

    return NextResponse.json({
      success: true,
      declaration: {
        id: declaration._id.toString(),
        nonce: declaration.nonce,
        status: declaration.status,
        txHash: declaration.txHash,
        executedAt: declaration.executedAt,
      },
    });
  } catch (error) {
    console.error('Error marking declaration as executed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
