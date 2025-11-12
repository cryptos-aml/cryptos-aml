import { ethers } from 'ethers';
import type { EIP712Domain, EIP712Types, DeclarationMessage } from './types';

/**
 * Calculate the payload hash for AML declaration
 * 
 * TODO: This is a PLACEHOLDER implementation!
 * The client must provide the exact logic for calculating the payloadHash.
 * This should include:
 * - Compliance metrics
 * - Risk scores
 * - KYC verification status
 * - Any other relevant data
 * 
 * Current implementation: keccak256(owner + value + deadline)
 * This is temporary and MUST be replaced with actual business logic.
 * 
 * @param owner - Wallet address of the declarant
 * @param value - Amount in wei
 * @param deadline - Unix timestamp for expiration
 * @returns The keccak256 hash of the concatenated data
 */
export function calculatePayloadHash(
  owner: string,
  value: string,
  deadline: number
): string {
  // Normalize owner address to lowercase
  const normalizedOwner = owner.toLowerCase();
  
  // TODO: Replace with actual compliance data hashing logic
  // Example of what might be needed:
  // - KYC verification hash
  // - Risk score
  // - Compliance flags
  // - Source of funds declaration
  // - etc.
  
  // Temporary implementation: simple concatenation and hash
  const dataToHash = ethers.solidityPacked(
    ['address', 'uint256', 'uint256'],
    [normalizedOwner, value, deadline]
  );
  
  return ethers.keccak256(dataToHash);
}

/**
 * Verify that an EIP-712 signature is valid
 * 
 * NOTE: For V1, signature verification is NOT performed on the backend.
 * The operator will verify signatures via the smart contract.
 * This function is provided for future use.
 * 
 * @param domain - EIP-712 domain
 * @param types - EIP-712 types
 * @param message - Message that was signed
 * @param signature - The signature to verify
 * @returns The recovered signer address
 */
export function verifyTypedDataSignature(
  domain: EIP712Domain,
  types: EIP712Types,
  message: DeclarationMessage,
  signature: string
): string {
  const recoveredAddress = ethers.verifyTypedData(domain, types, message, signature);
  return recoveredAddress;
}
