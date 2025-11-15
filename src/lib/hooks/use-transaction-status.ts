/**
 * Hook to poll and monitor transaction status
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { toast } from "sonner";
import { updateDeclarationTransaction } from "@/app/_actions/declarations";

interface UseTransactionStatusProps {
  declarationId: string;
  txHash: string | null | undefined;
  status: string;
}

export function useTransactionStatus({
  declarationId,
  txHash,
  status,
}: UseTransactionStatusProps) {
  const router = useRouter();
  const [txStatus, setTxStatus] = useState<
    "pending" | "executed" | "failed" | null
  >(status === "pending" && txHash ? "pending" : null);

  useEffect(() => {
    if (!txHash || status !== "pending") return;

    const checkTxStatus = async () => {
      if (!window.ethereum) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const receipt = await provider.getTransactionReceipt(txHash);

        if (receipt) {
          const newStatus = receipt.status === 1 ? "executed" : "failed";
          await updateDeclarationTransaction(declarationId, txHash, newStatus);
          setTxStatus(newStatus);

          if (newStatus === "executed") {
            toast.success("Transaction confirmed!");
          } else {
            toast.error("Transaction failed!");
          }

          router.refresh();
        }
      } catch (error) {
        console.error("Error checking tx status:", error);
      }
    };

    checkTxStatus();
    const interval = setInterval(checkTxStatus, 5000);

    return () => clearInterval(interval);
  }, [txHash, status, declarationId, router]);

  return txStatus;
}
