import { NextRequest, NextResponse } from "next/server";
import {
  AML_DECLARATION_TEXT,
  getDeadline,
  generateNonce,
  usdcToUnits,
} from "@/lib/constants";

export interface SignParamsResponse {
  to: string;
  amount: string;
  nonce: string;
  deadline: number;
  message: string;
  // For display
  amountUsdc: string;
}

/**
 * GET /api/sign-params?wallet=0x...&amount=100.50&to=0x...
 * Returns signing parameters for amlChain contract
 * Message format: keccak256(abi.encodePacked("Transfer", to, amount, nonce))
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    const amountUsdc = searchParams.get("amount");
    const to = searchParams.get("to");

    // Validate wallet address
    if (!wallet || !wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Validate destination address
    if (!to || !to.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: "Invalid destination address" },
        { status: 400 }
      );
    }

    // Validate amount
    if (!amountUsdc || parseFloat(amountUsdc) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Generate unique nonce as uint256
    const nonce = generateNonce();

    // Calculate deadline
    const deadline = getDeadline();

    // Convert USDC to token units (6 decimals)
    const amount = usdcToUnits(amountUsdc);

    // Build response
    const response: SignParamsResponse = {
      to,
      amount,
      nonce: nonce.toString(),
      deadline,
      message: AML_DECLARATION_TEXT,
      amountUsdc,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error generating sign params:", error);
    return NextResponse.json(
      { error: "Failed to generate signing parameters" },
      { status: 500 }
    );
  }
}
