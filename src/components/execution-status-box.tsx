/**
 * Execution status box component
 */

import { CheckCircle, XCircle, Clock } from "lucide-react";

interface ExecutionStatusBoxProps {
  status: "pending" | "executed" | "failed";
  txHash?: string;
  executionError?: string | null;
}

export function ExecutionStatusBox({
  status,
  txHash,
  executionError,
}: ExecutionStatusBoxProps) {
  // Show error box if there's an execution error
  if (executionError) {
    return (
      <div className="p-4 border rounded-md space-y-2 bg-red-500/10 border-red-500/20">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-700 dark:text-red-400 shrink-0" />
          <h3 className="font-semibold text-red-700 dark:text-red-400">
            Execution Failed
          </h3>
        </div>
        <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
          {executionError}
        </p>
      </div>
    );
  }

  if (status === "pending" && !txHash) {
    return null; // Don't show box if no transaction yet
  }

  const isSuccess = status === "executed";
  const isFailed = status === "failed";
  // const isPending = status === "pending";

  const bgColor = isSuccess
    ? "bg-green-500/10 border-green-500/20"
    : isFailed
    ? "bg-red-500/10 border-red-500/20"
    : "bg-yellow-500/10 border-yellow-500/20";

  const textColor = isSuccess
    ? "text-green-700 dark:text-green-400"
    : isFailed
    ? "text-red-700 dark:text-red-400"
    : "text-yellow-700 dark:text-yellow-400";

  const Icon = isSuccess ? CheckCircle : isFailed ? XCircle : Clock;

  const title = isSuccess
    ? "Transfer Executed Successfully!"
    : isFailed
    ? "Transfer Failed"
    : "Transfer Pending";

  const message = isSuccess
    ? "The transfer has been completed on-chain and confirmed."
    : isFailed
    ? "The transfer failed. Please check the transaction details on Etherscan."
    : "The transfer is being processed on-chain. Please wait for confirmation.";

  return (
    <div className={`p-4 border rounded-md space-y-2 ${bgColor}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${textColor} shrink-0`} />
        <h3 className={`font-semibold ${textColor}`}>{title}</h3>
      </div>

      <p className="text-sm text-muted-foreground break-words">{message}</p>

      {txHash && (
        <p className="text-xs font-mono text-muted-foreground break-all">
          Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
        </p>
      )}
    </div>
  );
}
