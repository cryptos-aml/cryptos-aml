import { NextRequest, NextResponse } from "next/server";
import { connectDB, Declaration } from "@/lib/mongodb";
import { calculatePayloadHash } from "@/lib/crypto";
import { VAULT_ADDRESS } from "@/lib/constants";
import type {
  CreateDeclarationRequest,
  CreateDeclarationResponse,
  ErrorResponse,
} from "@/lib/types";

/**
 * POST /api/declarations
 * Create a new AML declaration (legacy endpoint - prefer server actions)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CreateDeclarationRequest = await request.json();

    // Validate required fields
    const { owner, value, signature, nonce, deadline } = body;

    if (!owner || !value || !signature || nonce === undefined || !deadline) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Missing required fields",
          details: "owner, value, signature, nonce, and deadline are required",
        },
        { status: 400 }
      );
    }

    // Validate owner address
    if (!owner.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json<ErrorResponse>(
        { error: "Invalid owner address" },
        { status: 400 }
      );
    }

    // Validate signature format
    if (!signature.match(/^0x[a-fA-F0-9]{130}$/)) {
      return NextResponse.json<ErrorResponse>(
        { error: "Invalid signature format" },
        { status: 400 }
      );
    }

    // Server-controlled vault address
    const to = VAULT_ADDRESS;

    // Calculate payload hash
    const payloadHash = calculatePayloadHash(owner, value, deadline);

    // Connect to database
    await connectDB();

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

    // Return success response
    const response: CreateDeclarationResponse = {
      id: declaration._id?.toString() || "",
      status: "pending",
      payloadHash,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating declaration:", error);

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      return NextResponse.json<ErrorResponse>(
        { error: "Failed to create declaration", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ErrorResponse>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
