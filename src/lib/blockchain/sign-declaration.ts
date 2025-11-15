/**
 * Sign AML declaration logic
 */

import { ethers } from "ethers";
import { toast } from "sonner";
import {
  AML_CONTRACT_ADDRESS,
  VAULT_ADDRESS,
  usdcToUnits,
  PERMIT_VALIDITY_DURATION,
} from "@/lib/constants";
import { signAMLDeclaration } from "@/lib/eip712";
import { signPermit } from "@/lib/blockchain/sign-permit";
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
 * Sign AML declaration with Permit (EIP-2612) - No gas fees! 🚀
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

    // Sign Permit (EIP-2612) for gasless USDC approval 🚀
    toast.info("Signing gasless approval (Permit)...", { duration: 2000 });
    
    // Permit deadline: 24 hours from now
    const permitDeadline = Math.floor(Date.now() / 1000) + PERMIT_VALIDITY_DURATION;
    
    let permitSignature;
    try {
      permitSignature = await signPermit(
        signer,
        AML_CONTRACT_ADDRESS,
        amountUnits,
        permitDeadline
      );
    } catch (error) {
      console.error("Permit signature error:", error);
      const message = error instanceof Error ? error.message : "Failed to sign permit";
      
      if (message.includes("user rejected") || message.includes("User denied")) {
        toast.warning("Permit cancelled by user", { duration: 3000 });
        return {
          success: false,
          error: "User cancelled permit signature",
        };
      }
      
      toast.error(`Permit failed: ${message}`, { duration: 4000 });
      return {
        success: false,
        error: message,
      };
    }

    // Save to database with permit data
    toast.info("Saving declaration...", { duration: 2000 });
    const data = await createDeclaration({
      owner: walletAddress,
      to: VAULT_ADDRESS,
      value: amountUnits,
      signature,
      nonce: nonce,
      amlDeclarationHash,
      permitV: permitSignature.v,
      permitR: permitSignature.r,
      permitS: permitSignature.s,
      permitDeadline: permitSignature.deadline,
    });

    toast.success("✅ Declaration signed with gasless approval!", {
      duration: 4000,
    });

    return {
      success: true,
      declarationId: data.id,
      needsApproval: false,
      approvalStatus: "success",
    };
  } catch (error: unknown) {
    console.error("Sign declaration error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to sign declaration";
    return { success: false, error: message };
  }
}
