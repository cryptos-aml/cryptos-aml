/**
 * EIP-712 Typed Data Signing for AML Declarations
 */

import { ethers } from "ethers";
import { AML_DECLARATION_TEXT, VAULT_ADDRESS, CHAIN_ID } from "./constants";

/**
 * EIP-712 Domain for AMLChainV2
 */
export function getEIP712Domain(contractAddress: string) {
  return {
    name: "AMLChain",
    version: "2",
    chainId: CHAIN_ID,
    verifyingContract: contractAddress,
  };
}

/**
 * EIP-712 Types for Transfer
 */
export const EIP712_TYPES = {
  Transfer: [
    { name: "amlDeclaration", type: "string" },
    { name: "vault", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
};

/**
 * Sign an AML declaration using EIP-712
 * @param signer Ethers signer
 * @param contractAddress AML contract address
 * @param amount USDC amount in wei (e.g., 1000000 = 1 USDC)
 * @param nonce Nonce (timestamp)
 * @returns EIP-712 signature
 */
export async function signAMLDeclaration(
  signer: ethers.Signer,
  contractAddress: string,
  amount: string,
  nonce: string
): Promise<string> {
  // Build EIP-712 message with full text (will display in MetaMask!)
  const message = {
    amlDeclaration: AML_DECLARATION_TEXT,
    vault: VAULT_ADDRESS,
    amount: amount,
    nonce: nonce,
  };

  const domain = getEIP712Domain(contractAddress);

  // Sign using EIP-712
  const signature = await signer.signTypedData(domain, EIP712_TYPES, message);

  return signature;
}

/**
 * Verify an EIP-712 signature (for testing)
 * @param signature Signature to verify
 * @param signerAddress Expected signer address
 * @param contractAddress AML contract address
 * @param amount USDC amount
 * @param nonce Nonce
 * @returns True if signature is valid
 */
export function verifySignature(
  signature: string,
  signerAddress: string,
  contractAddress: string,
  amount: string,
  nonce: string
): boolean {
  try {
    const message = {
      amlDeclaration: AML_DECLARATION_TEXT,
      vault: VAULT_ADDRESS,
      amount: amount,
      nonce: nonce,
    };

    const domain = getEIP712Domain(contractAddress);

    const recoveredAddress = ethers.verifyTypedData(
      domain,
      EIP712_TYPES,
      message,
      signature
    );

    return recoveredAddress.toLowerCase() === signerAddress.toLowerCase();
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}
