import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Declaration, IDeclaration } from '@/lib/mongodb';
import type { ErrorResponse } from '@/lib/types';

/**
 * GET /api/declarations/[wallet]
 * Fetch all declarations for a specific wallet address
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;

    // Validate wallet address format
    if (!wallet || !wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Query declarations for this wallet
    const declarations = await Declaration.find({
      owner: wallet.toLowerCase(),
    })
      .sort({ createdAt: -1 }) // Most recent first
      .lean<IDeclaration[]>()
      .exec();

    // Transform MongoDB documents to JSON-serializable format
    const response = declarations.map((doc) => ({
      _id: doc._id?.toString(),
      owner: doc.owner,
      to: doc.to,
      value: doc.value,
      payloadHash: doc.payloadHash,
      signature: doc.signature,
      nonce: doc.nonce,
      deadline: doc.deadline,
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
      executedAt: doc.executedAt ? doc.executedAt.toISOString() : null,
      txHash: doc.txHash || null,
    }));

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error fetching declarations:', error);
    
    if (error instanceof Error) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch declarations', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
