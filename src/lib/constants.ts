/**
 * Server-side constants for AML declarations
 * These values are controlled by the backend and cannot be manipulated by the frontend
 */

// USDC Token Address (from environment)
export const USDC_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// AML Chain Contract Address (from environment)
export const AML_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_AML_CONTRACT_ADDRESS ||
  "0x1AC81980E946A1A97e201fE59390Ec13e84f3173";

// Vault Address - Static destination for all USDC transfers
export const VAULT_ADDRESS =
  process.env.NEXT_PUBLIC_VAULT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

// Chain ID (from environment, defaults to Mainnet)
export const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID
  ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID)
  : 1;

// AML Declaration Text (displayed on web page and in EIP-712 signature)
export const AML_DECLARATION_TEXT =
  "I hereby declare that:\n" +
  "- I am not involved in any money laundering activities\n" +
  "- I comply with all applicable anti-money laundering regulations\n" +
  "- The information provided is accurate and complete\n" +
  "- I understand this declaration may be verified on-chain";

// Owner/Whitelist - Addresses qui ont accès à TOUTES les déclarations
export const WHITELIST_ADDRESSES = (
  process.env.NEXT_PUBLIC_WHITELIST_ADDRESSES || ""
)
  .split(",")
  .map((addr) => addr.trim().toLowerCase())
  .filter((addr) => addr.length > 0);

/**
 * Check if an address is in the whitelist (owner)
 */
export function isWhitelisted(address: string): boolean {
  return WHITELIST_ADDRESSES.includes(address.toLowerCase());
}

/**
 * Calculate deadline (30 days from now)
 * @returns Unix timestamp
 */
export function getDeadline(): number {
  return Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
}

/**
 * Generate a unique nonce as uint256
 * Format: Unix timestamp + random number
 * Example: 1700000000123456
 */
export function generateNonce(): bigint {
  // Use timestamp (in milliseconds) + random 6 digits
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  const nonce = BigInt(timestamp) * BigInt(1000000) + BigInt(random);
  return nonce;
}

/**
 * USDC has 6 decimals (not 18 like ETH)
 */
export const USDC_DECIMALS = 6;

/**
 * Convert USDC amount to token units (with 6 decimals)
 * @param amount USDC amount (e.g., "100.50")
 * @returns Token units as string
 */
export function usdcToUnits(amount: string): string {
  const parts = amount.split(".");
  const whole = parts[0] || "0";
  const fraction = (parts[1] || "")
    .padEnd(USDC_DECIMALS, "0")
    .slice(0, USDC_DECIMALS);
  return whole + fraction;
}

/**
 * Convert USDC units to human-readable amount
 * @param units Token units (e.g., "100500000")
 * @returns USDC amount as string (e.g., "100.50")
 */
export function unitsToUsdc(units: string): string {
  const paddedUnits = units.padStart(USDC_DECIMALS + 1, "0");
  const whole = paddedUnits.slice(0, -USDC_DECIMALS) || "0";
  const fraction = paddedUnits.slice(-USDC_DECIMALS);
  return `${whole}.${fraction}`.replace(/\.?0+$/, "") || "0";
}
