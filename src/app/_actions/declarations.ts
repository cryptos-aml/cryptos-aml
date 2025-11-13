"use server";

import { connectDB, Declaration } from "@/lib/mongodb";
import { calculatePayloadHash } from "@/lib/crypto";
import type {
  CreateDeclarationRequest,
  CreateDeclarationResponse,
} from "@/lib/types";

/**
 * Server action to create a new AML declaration
 * Accepts: owner, to, value, signature, nonce, deadline
 * Compatible with amlChain contract format
 */
export async function createDeclaration(
  data: CreateDeclarationRequest
): Promise<CreateDeclarationResponse> {
  const { owner, to, value, signature, nonce, deadline } = data;

  // Validate required fields
  if (!owner || !to || !value || !signature || !nonce || !deadline) {
    throw new Error("Missing required fields");
  }

  // Validate owner address
  if (!owner.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error("Invalid owner address");
  }

  // Validate to address
  if (!to.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error("Invalid destination address");
  }

  // Validate signature format
  if (!signature.match(/^0x[a-fA-F0-9]{130}$/)) {
    throw new Error("Invalid signature format");
  }

  // Validate nonce format (uint256 as string)
  if (typeof nonce !== "string" || !/^\d+$/.test(nonce)) {
    throw new Error("Invalid nonce format (must be uint256 string)");
  }

  // Validate value
  try {
    const valueNum = parseFloat(value);
    if (isNaN(valueNum) || valueNum <= 0) {
      throw new Error("Invalid value: must be greater than 0");
    }
  } catch {
    throw new Error("Invalid value format");
  }

  // Calculate payload hash (for tracking purposes)
  const payloadHash = calculatePayloadHash(owner, value, deadline);

  // Connect to database
  await connectDB();

  // Verify nonce is unique (prevent replay attacks)
  const existingNonce = await Declaration.findOne({ nonce });
  if (existingNonce) {
    throw new Error(
      "Nonce already used - please request new signing parameters"
    );
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
    status: "pending",
  });

  return {
    id: declaration._id?.toString() || "",
    status: "pending",
    payloadHash,
  };
}

/**
 * Server action to get declarations by wallet address
 */
export async function getDeclarationsByWallet(wallet: string) {
  await connectDB();

  const declarations = await Declaration.find({ owner: wallet.toLowerCase() })
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(declarations));
}

/**
 * Server action to get a single declaration by ID
 */
export async function getDeclarationById(id: string) {
  try {
    await connectDB();

    const declaration = await Declaration.findById(id).lean();

    if (!declaration) {
      return null;
    }

    return JSON.parse(JSON.stringify(declaration));
  } catch (error) {
    console.error("Error fetching declaration:", error);
    return null;
  }
}

/**
 * Server action to update transaction hash and status
 */
export async function updateDeclarationTransaction(
  id: string,
  txHash: string,
  status?: "pending" | "executed" | "failed"
) {
  try {
    await connectDB();

    const updateData: {
      txHash: string;
      status?: string;
      executedAt?: Date;
    } = { txHash };

    if (status) {
      updateData.status = status;
      if (status === "executed") {
        updateData.executedAt = new Date();
      }
    }

    const declaration = await Declaration.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).lean();

    if (!declaration) {
      throw new Error("Declaration not found");
    }

    return JSON.parse(JSON.stringify(declaration));
  } catch (error) {
    console.error("Error updating declaration:", error);
    throw error;
  }
}
