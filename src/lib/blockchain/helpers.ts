/**
 * Blockchain helper utilities
 */

import { AML_CONTRACT_ADDRESS, CHAIN_ID } from "@/lib/constants";

interface Declaration {
  owner: string;
  to: string;
  value: string;
  nonce: string;
  signature: string;
  amlDeclarationHash?: string;
}

/**
 * Copy all contract parameters to clipboard
 */
export function copyAllParameters(declaration: Declaration): string {
  return `signer: ${declaration.owner}
to: ${declaration.to}
amount: ${declaration.value}
nonce: ${declaration.nonce}
amlDeclarationHash: ${declaration.amlDeclarationHash || "N/A"}
signature: ${declaration.signature}`;
}

/**
 * Get Etherscan URL for the contract
 */
export function getEtherscanUrl(): string {
  const etherscanBase =
    CHAIN_ID === 1
      ? "https://etherscan.io"
      : CHAIN_ID === 31337
      ? "http://localhost:8545"
      : "https://sepolia.etherscan.io";

  return `${etherscanBase}/address/${AML_CONTRACT_ADDRESS}#writeContract#F3`;
}
