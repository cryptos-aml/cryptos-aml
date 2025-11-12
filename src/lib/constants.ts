/**
 * Server-side constants for AML declarations
 * These values are controlled by the backend and cannot be manipulated by the frontend
 */

// TODO: Replace with actual vault address from client
export const VAULT_ADDRESS = '0x0000000000000000000000000000000000000000';

// TODO: Replace with actual AML declaration text from client
export const AML_DECLARATION_TEXT = `
I hereby declare that:
1. The funds I am depositing are from legitimate sources
2. I am not involved in any money laundering activities
3. I comply with all applicable anti-money laundering regulations
4. The information provided is accurate and complete
5. I understand this declaration may be verified on-chain
`.trim();

// EIP-712 Domain configuration
// TODO: Confirm these values match your smart contract
export const EIP712_DOMAIN = {
  name: 'Asset Manager AML Declaration',
  version: '1',
  chainId: 1, // Ethereum Mainnet
} as const;

// EIP-712 Types structure
export const EIP712_TYPES = {
  Declaration: [
    { name: 'owner', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'message', type: 'string' },
    { name: 'nonce', type: 'string' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

/**
 * Calculate deadline (30 days from now)
 * @returns Unix timestamp
 */
export function getDeadline(): number {
  return Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
}

/**
 * Generate a unique nonce ID in base58 format (Solana-style)
 * Format: 11 characters, cryptographically random
 * Example: 5Kn7xN9mPqL
 */
export function generateNonceId(): string {
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const length = 11;
  let result = '';
  
  // Use crypto for randomness
  const randomValues = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }
  
  for (let i = 0; i < length; i++) {
    result += base58Chars[randomValues[i] % base58Chars.length];
  }
  
  return result;
}

/**
 * Get next nonce for a wallet (deprecated - now using nonce IDs)
 * Kept for backwards compatibility
 */
export async function getNextNonce(walletAddress: string): Promise<number> {
  const { Declaration } = await import('./mongodb');
  const count = await Declaration.countDocuments({
    owner: walletAddress.toLowerCase(),
  });
  return count + 1;
}
