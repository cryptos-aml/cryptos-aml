'use server';

import { connectDB, Declaration } from '@/lib/mongodb';
import { calculatePayloadHash } from '@/lib/crypto';
import { VAULT_ADDRESS } from '@/lib/constants';
import type { CreateDeclarationRequest, CreateDeclarationResponse } from '@/lib/types';

/**
 * Server action to create a new AML declaration
 * Only accepts minimal data from client: owner, value, signature, nonce, deadline
 * All other parameters (vault, message) are controlled server-side
 */
export async function createDeclaration(
  data: CreateDeclarationRequest
): Promise<CreateDeclarationResponse> {
  const { owner, value, signature, nonce, deadline } = data;

  // Validate required fields
  if (!owner || !value || !signature || !nonce || !deadline) {
    throw new Error('Missing required fields');
  }

  // Validate owner address
  if (!owner.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid owner address');
  }

  // Validate signature format
  if (!signature.match(/^0x[a-fA-F0-9]{130}$/)) {
    throw new Error('Invalid signature format');
  }

  // Validate nonce format (should be 11 character base58 string)
  if (typeof nonce !== 'string' || nonce.length !== 11) {
    throw new Error('Invalid nonce format');
  }

  // Validate value
  try {
    const valueNum = parseFloat(value);
    if (isNaN(valueNum) || valueNum <= 0) {
      throw new Error('Invalid value: must be greater than 0');
    }
  } catch {
    throw new Error('Invalid value format');
  }

  // Server-controlled parameters
  const to = VAULT_ADDRESS;

  // Calculate payload hash
  const payloadHash = calculatePayloadHash(owner, value, deadline);

  // Connect to database
  await connectDB();

  // Verify nonce is unique (prevent replay attacks)
  const existingNonce = await Declaration.findOne({ nonce });
  if (existingNonce) {
    throw new Error('Nonce already used - please request new signing parameters');
  }

  // Create declaration document
  const declaration = await Declaration.create({
    owner: owner.toLowerCase(),
    to: to.toLowerCase(),
    value,
    payloadHash,
    signature,
    nonce,
    deadline,
    status: 'pending',
  });

  return {
    id: declaration._id?.toString() || '',
    status: 'pending',
    payloadHash,
  };
}

/**
 * Server action to fetch declarations for a wallet
 */
export async function getDeclarationsByWallet(wallet: string) {
  // Validate wallet address format
  if (!wallet || !wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid wallet address format');
  }

  // Connect to database
  await connectDB();

  // Query declarations for this wallet
  const declarations = await Declaration.find({
    owner: wallet.toLowerCase(),
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  // Transform to JSON-serializable format
  return declarations.map((doc) => ({
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
}
