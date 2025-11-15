"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { DeclarationParameter } from "@/components/declaration-parameter";
import { TransactionStatus } from "@/components/transaction-status";
import { ExecutionStatusBox } from "@/components/execution-status-box";
import { updateDeclarationTransaction } from "@/app/_actions/declarations";
import { executeTransfer } from "@/lib/blockchain/execute-transfer";
import { copyAllParameters, getEtherscanUrl } from "@/lib/blockchain/helpers";
import { useTransactionStatus } from "@/lib/hooks/use-transaction-status";
import { ethers } from "ethers";

interface Declaration {
  _id: string;
  owner: string;
  to: string;
  value: string;
  signature: string;
  nonce: string;
  status: string;
  createdAt: string;
  txHash?: string | null;
}

interface Props {
  declaration: Declaration;
}

export function DeclarationClient({ declaration }: Props) {
  const router = useRouter();
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Use custom hook for transaction status polling
  const txStatus = useTransactionStatus({
    declarationId: declaration._id,
    txHash: declaration.txHash,
    status: declaration.status,
  });

  // Execute transfer handler
  const handleExecuteTransfer = async () => {
    setExecuting(true);
    setExecutionError(null);

    const result = await executeTransfer(declaration);

    if (result.success && result.txHash) {
      await updateDeclarationTransaction(declaration._id, result.txHash);

      const provider = new ethers.BrowserProvider(window.ethereum!);
      const receipt = await provider.getTransaction(result.txHash);
      await receipt?.wait();

      const txReceipt = await provider.getTransactionReceipt(result.txHash);
      const status = txReceipt?.status === 1 ? "executed" : "failed";

      await updateDeclarationTransaction(
        declaration._id,
        result.txHash,
        status
      );

      if (status === "executed") {
        toast.success("Transfer executed successfully!", { duration: 3000 });
      } else {
        toast.error("Transaction failed!");
        setExecutionError("Transaction failed on-chain");
      }

      router.refresh();
    } else if (result.error) {
      toast.error(result.error);
      setExecutionError(result.error);
    }

    setExecuting(false);
  };

  // Copy all parameters
  const handleCopyAll = () => {
    const text = copyAllParameters(declaration);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("All parameters copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Open Etherscan
  const handleOpenEtherscan = () => {
    window.open(getEtherscanUrl(), "_blank");
  };

  return (
    <>
      <Card className="border-border shadow-2xl gap-0">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Declaration</CardTitle>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={declaration.status} />
              <span className="text-xs text-muted-foreground">
                {new Date(declaration.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Execution Status Box */}
          <ExecutionStatusBox
            status={declaration.status as "pending" | "executed" | "failed"}
            txHash={declaration.txHash || undefined}
            executionError={executionError}
          />

          {/* Contract Call Parameters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Contract Call Parameters
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAll}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy All
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Use these parameters to call{" "}
              <code className="bg-muted px-1 py-0.5 rounded">
                transferTokens()
              </code>{" "}
              on the contract
            </p>

            {/* Parameters Display */}
            <div className="space-y-2">
              <DeclarationParameter
                label="signer"
                type="address"
                value={declaration.owner}
              />
              <DeclarationParameter
                label="to"
                type="address"
                value={declaration.to}
              />
              <DeclarationParameter
                label="amount"
                type="uint256"
                value={declaration.value}
              />
              <DeclarationParameter
                label="nonce"
                type="uint256"
                value={declaration.nonce}
              />
              <DeclarationParameter
                label="signature"
                type="bytes"
                value={declaration.signature}
              />
            </div>

            <p className="text-xs text-yellow-500 italic flex items-start gap-1">
              <span>💡</span>
              <span>
                Copy these parameters to execute the transfer on Etherscan or
                your contract interface
              </span>
            </p>
          </div>

          {/* Transaction Hash - if exists */}
          {declaration.txHash && (
            <>
              <Separator />
              <TransactionStatus
                txHash={declaration.txHash}
                status={txStatus}
              />
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleExecuteTransfer}
              disabled={executing}
              className="w-full h-12 gap-2"
              size="lg"
            >
              <Send className="h-5 w-5" />
              {executing ? "Executing..." : "Execute Transfer Now"}
            </Button>

            <Button
              onClick={handleOpenEtherscan}
              variant="outline"
              className="w-full h-12 gap-2"
              size="lg"
            >
              <ExternalLink className="h-5 w-5" />
              Execute Manually on Etherscan
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-muted-foreground text-xs mt-4">
        Secured by cryptographic signatures • Zero gas fees • Instant
        verification
      </p>
    </>
  );
}
