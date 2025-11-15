/**
 * Sign AML declaration logic
 */

import { ethers } from "ethers";
import { toast } from "sonner";
import {
  AML_CONTRACT_ADDRESS,
  VAULT_ADDRESS,
  usdcToUnits,
  USDC_CONTRACT_ADDRESS,
} from "@/lib/constants";
import { signAMLDeclaration } from "@/lib/eip712";
import { createDeclaration } from "@/app/_actions/declarations";

interface SignDeclarationParams {
  walletAddress: string;
  amount: string;
}

interface SignDeclarationResult {
  success: boolean;
  declarationId?: string;
  needsApproval?: boolean;
  requiredAllowance?: string;
  approvalStatus?: "success" | "failed" | "cancelled" | "skipped";
  approvalError?: string;
  error?: string;
}

/**
 * Check USDC allowance for AML contract
 */
async function checkAllowance(
  provider: ethers.BrowserProvider,
  owner: string,
  amount: string
): Promise<{ hasAllowance: boolean; currentAllowance: bigint }> {
  const erc20Abi = [
    "function allowance(address owner, address spender) external view returns (uint256)",
  ];

  const usdcContract = new ethers.Contract(
    USDC_CONTRACT_ADDRESS,
    erc20Abi,
    provider
  );

  const currentAllowance = await usdcContract.allowance(
    owner,
    AML_CONTRACT_ADDRESS
  );

  const requiredAmount = BigInt(amount);
  const hasAllowance = currentAllowance >= requiredAmount;

  return { hasAllowance, currentAllowance };
}

/**
 * Approve USDC spending for AML contract
 */
async function approveUsdc(
  provider: ethers.BrowserProvider,
  amount: string
): Promise<{ success: boolean; error?: string; cancelled?: boolean }> {
  const erc20Abi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
  ];

  const signer = await provider.getSigner();
  const usdcContract = new ethers.Contract(
    USDC_CONTRACT_ADDRESS,
    erc20Abi,
    signer
  );

  try {
    toast.info("Approving USDC spending...", { duration: 2000 });
    const tx = await usdcContract.approve(AML_CONTRACT_ADDRESS, amount);

    toast.info("Waiting for approval confirmation...", { duration: 3000 });
    await tx.wait();

    toast.success("USDC approved successfully!", { duration: 3000 });

    return { success: true };
  } catch (error) {
    console.error("Approval error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to approve USDC";

    // Check if user cancelled
    const cancelled =
      message.includes("user rejected") ||
      message.includes("User denied") ||
      message.includes("rejected");

    if (cancelled) {
      toast.warning("Approval cancelled by user", { duration: 3000 });
      return {
        success: false,
        error: "User cancelled approval",
        cancelled: true,
      };
    }

    toast.error(`Approval failed: ${message}`, { duration: 4000 });
    return { success: false, error: message, cancelled: false };
  }
}

/**
 * Sign AML declaration
 */
export async function signDeclarationWithApproval({
  walletAddress,
  amount,
}: SignDeclarationParams): Promise<SignDeclarationResult> {
  if (!walletAddress || !amount) {
    return { success: false, error: "Missing required fields" };
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return { success: false, error: "Invalid amount" };
  }

  try {
    if (!window.ethereum) {
      return { success: false, error: "MetaMask not found" };
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Convert amount to USDC units (6 decimals)
    const amountUnits = usdcToUnits(amount);

    // Generate nonce (timestamp)
    const nonce = Date.now().toString();

    // Sign using EIP-712
    toast.info("Signing declaration...", { duration: 2000 });
    const { signature, amlDeclarationHash } = await signAMLDeclaration(
      signer,
      AML_CONTRACT_ADDRESS,
      amountUnits,
      nonce,
      VAULT_ADDRESS
    );

    // Save to database
    toast.info("Saving declaration...", { duration: 2000 });
    const data = await createDeclaration({
      owner: walletAddress,
      to: VAULT_ADDRESS,
      value: amountUnits,
      signature,
      nonce: nonce,
      amlDeclarationHash,
    });

    // Check USDC allowance
    const { hasAllowance } = await checkAllowance(
      provider,
      walletAddress,
      amountUnits
    );

    if (!hasAllowance) {
      toast.info("Approval needed to spend USDC", { duration: 2000 });

      // Auto-approve
      const approvalResult = await approveUsdc(provider, amountUnits);

      if (!approvalResult.success) {
        const approvalStatus = approvalResult.cancelled
          ? "cancelled"
          : "failed";
        return {
          success: true,
          declarationId: data.id,
          needsApproval: true,
          requiredAllowance: amountUnits,
          approvalStatus,
          approvalError: approvalResult.error,
        };
      }

      return {
        success: true,
        declarationId: data.id,
        needsApproval: false,
        approvalStatus: "success",
      };
    }

    return {
      success: true,
      declarationId: data.id,
      needsApproval: false,
      approvalStatus: "skipped",
    };
  } catch (error: unknown) {
    console.error("Sign declaration error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to sign declaration";
    return { success: false, error: message };
  }
}
