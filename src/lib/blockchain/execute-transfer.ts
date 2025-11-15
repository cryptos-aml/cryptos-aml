/**
 * Blockchain transfer execution logic
 */

import { ethers } from "ethers";
import { toast } from "sonner";
import { AML_CONTRACT_ADDRESS, CHAIN_ID } from "@/lib/constants";

const AML_ABI = [
  "function transferTokensWithPermit(address signer, address to, uint256 amount, uint256 nonce, bytes32 amlDeclarationHash, bytes signature, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
];

interface Declaration {
  owner: string;
  to: string;
  value: string;
  nonce: string;
  signature: string;
}

interface ExecuteTransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Execute AML transfer on-chain
 */
export async function executeTransfer(
  declaration: Declaration
): Promise<ExecuteTransferResult> {
  if (!window.ethereum) {
    return { success: false, error: "MetaMask not installed" };
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Check network
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    if (chainId !== CHAIN_ID) {
      throw new Error(`Wrong network. Please switch to Chain ID ${CHAIN_ID}`);
    }

    // Validate contract address
    if (!AML_CONTRACT_ADDRESS) {
      throw new Error("Contract address not configured");
    }

    // Execute transfer (approval must be done by the signer beforehand)
    const contract = new ethers.Contract(AML_CONTRACT_ADDRESS, AML_ABI, signer);

    // Log for debugging
    console.log("🔐 Executing transferTokensWithPermit() with:");
    console.log(
      "├─ Function: transferTokensWithPermit(address,address,uint256,uint256,bytes32,bytes,uint256,uint8,bytes32,bytes32)"
    );
    console.log(`├─ signer: ${declaration.owner}`);
    console.log(`├─ to: ${declaration.to} (must match EIP-712 vault)`);
    console.log(
      `├─ amount: ${(parseFloat(declaration.value) / 1000000).toFixed(
        2
      )} USDC (${declaration.value} wei)`
    );
    console.log(`├─ nonce: ${declaration.nonce}`);
    console.log(
      `├─ amlDeclarationHash: ${(declaration as any).amlDeclarationHash}`
    );
    console.log(`├─ signature: ${declaration.signature.slice(0, 20)}...`);
    console.log(`├─ permitDeadline: ${(declaration as any).permitDeadline}`);
    console.log(`├─ permitV: ${(declaration as any).permitV}`);
    console.log(`├─ permitR: ${(declaration as any).permitR?.slice(0, 20)}...`);
    console.log(`└─ permitS: ${(declaration as any).permitS?.slice(0, 20)}...`);
    console.log(
      "🔒 Contract will verify AML signature + execute gasless permit!"
    );

    toast.info("Executing transfer with gasless approval...", {
      duration: 2000,
    });
    const tx = await contract.transferTokensWithPermit(
      declaration.owner,
      declaration.to,
      declaration.value,
      declaration.nonce,
      (declaration as any).amlDeclarationHash,
      declaration.signature,
      (declaration as any).permitDeadline,
      (declaration as any).permitV,
      (declaration as any).permitR,
      (declaration as any).permitS
    );

    toast.success(`Transaction sent! Hash: ${tx.hash.slice(0, 10)}...`, {
      duration: 4000,
    });

    return { success: true, txHash: tx.hash };
  } catch (error: unknown) {
    console.error("Error executing transfer:", error);
    const message =
      error instanceof Error ? error.message : "Failed to execute transfer";
    return { success: false, error: message };
  }
}
