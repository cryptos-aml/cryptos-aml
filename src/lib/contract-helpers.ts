import { ethers } from "ethers";

/**
 * Generate the message hash for amlChain contract signature
 * Message format: keccak256(abi.encodePacked("Transfer", to, amount, nonce))
 *
 * @param to Destination address (vault)
 * @param amount Amount in USDC units (uint256 as string)
 * @param nonce Unique nonce (uint256 as string)
 * @returns Message hash
 */
export function generateContractMessageHash(
  to: string,
  amount: string,
  nonce: string
): string {
  // Encode the message like in Solidity: abi.encodePacked("Transfer", to, amount, nonce)
  const messageHash = ethers.solidityPackedKeccak256(
    ["string", "address", "uint256", "uint256"],
    ["Transfer", to, amount, nonce]
  );

  return messageHash;
}

/**
 * Sign a message hash with personal_sign (adds Ethereum Signed Message prefix)
 * This matches the contract's signature verification
 *
 * @param signer Ethers signer
 * @param messageHash The hash to sign
 * @returns Signature (0x + 130 hex chars)
 */
export async function signMessageHash(
  signer: ethers.Signer,
  messageHash: string
): Promise<string> {
  // The contract uses ecrecover with "\x19Ethereum Signed Message:\n32" prefix
  // ethers.signMessage automatically adds this prefix for us
  const signature = await signer.signMessage(ethers.getBytes(messageHash));
  return signature;
}

/**
 * Format contract call parameters for display/copy-paste
 */
export interface ContractCallParams {
  signer: string;
  to: string;
  amount: string;
  nonce: string;
  amlDeclarationHash: string;
  signature: string;
  permitDeadline: number;
  permitV: number;
  permitR: string;
  permitS: string;
}

export function formatContractParams(params: ContractCallParams): string {
  return JSON.stringify(params, null, 2);
}

/**
 * AML Chain Contract ABI (minimal - only transferTokensWithPermit function)
 */
export const AML_CHAIN_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "signer",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "amlDeclarationHash",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "transferTokensWithPermit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Execute transferTokensWithPermit on the amlChain contract (gasless approval!)
 *
 * @param contractAddress Address of the deployed amlChain contract
 * @param params Transfer parameters including permit signature
 * @param signer Ethers signer (must be the operator/owner of the contract)
 * @returns Transaction receipt
 */
export async function executeTransferTokens(
  contractAddress: string,
  params: ContractCallParams,
  signer: ethers.Signer
) {
  const contract = new ethers.Contract(contractAddress, AML_CHAIN_ABI, signer);

  const tx = await contract.transferTokensWithPermit(
    params.signer,
    params.to,
    params.amount,
    params.nonce,
    params.amlDeclarationHash,
    params.signature,
    params.permitDeadline,
    params.permitV,
    params.permitR,
    params.permitS
  );

  const receipt = await tx.wait();
  return receipt;
}
