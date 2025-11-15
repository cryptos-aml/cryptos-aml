/**
 * Blockchain transfer execution logic
 */

import { ethers } from "ethers";
import { toast } from "sonner";
import { AML_CONTRACT_ADDRESS, CHAIN_ID } from "@/lib/constants";

const AML_ABI = [
  "function transferTokens(address signer, address to, uint256 amount, uint256 nonce, bytes signature) external",
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
    console.log("🔐 Executing transferTokens() with:");
    console.log(
      "├─ Function: transferTokens(address,address,uint256,uint256,bytes)"
    );
    console.log(`├─ signer: ${declaration.owner}`);
    console.log(`├─ to: ${declaration.to} (must match EIP-712 vault)`);
    console.log(
      `├─ amount: ${(parseFloat(declaration.value) / 1000000).toFixed(
        2
      )} USDC (${declaration.value} wei)`
    );
    console.log(`├─ nonce: ${declaration.nonce}`);
    console.log(`└─ signature: ${declaration.signature.slice(0, 20)}...`);
    console.log("🔒 Contract will verify all params match EIP-712 signature");

    toast.info("Executing transfer...", { duration: 2000 });
    const tx = await contract.transferTokens(
      declaration.owner,
      declaration.to,
      declaration.value,
      declaration.nonce,
      declaration.signature
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
