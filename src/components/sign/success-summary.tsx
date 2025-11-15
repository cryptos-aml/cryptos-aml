/**
 * Success summary component after signing
 */

import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface SuccessSummaryProps {
  declarationId: string;
  amount: string;
  approvalStatus?: "success" | "failed" | "cancelled" | "skipped";
  approvalError?: string;
}

export function SuccessSummary({
  declarationId,
  amount,
  approvalStatus,
  approvalError,
}: SuccessSummaryProps) {
  return (
    <div className="space-y-3">
      {/* Declaration Success */}
      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          <h3 className="font-semibold text-green-700 dark:text-green-400">
            Declaration Signed Successfully!
          </h3>
        </div>

        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium">Amount:</span> {amount} USDC
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">Declaration ID:</span>{" "}
            <span className="font-mono text-xs break-all">{declarationId}</span>
          </p>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Your declaration has been signed and saved.
        </p>
      </div>

      {/* Approval Status */}
      {approvalStatus === "success" && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
            <h3 className="font-semibold text-green-700 dark:text-green-400">
              USDC Approval Successful
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            The contract can now spend your USDC for this transfer.
          </p>
        </div>
      )}

      {approvalStatus === "skipped" && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />
            <h3 className="font-semibold text-blue-700 dark:text-blue-400">
              Approval Already Set
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            You already have sufficient USDC allowance for this contract.
          </p>
        </div>
      )}

      {approvalStatus === "cancelled" && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
            <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">
              Approval Cancelled
            </h3>
          </div>
          <p className="text-sm text-muted-foreground wrap-break-words">
            {approvalError || "You cancelled the USDC approval."}
          </p>
          <p className="text-xs text-muted-foreground">
            You&apos;ll need to approve USDC spending before executing the
            transfer.
          </p>
        </div>
      )}

      {approvalStatus === "failed" && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md space-y-2">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            <h3 className="font-semibold text-red-700 dark:text-red-400">
              Approval Failed
            </h3>
          </div>
          <p className="text-sm text-muted-foreground wrap-break-word">
            {approvalError || "Failed to approve USDC spending."}
          </p>
          <p className="text-xs text-muted-foreground">
            You&apos;ll need to approve USDC spending before executing the
            transfer.
          </p>
        </div>
      )}
    </div>
  );
}
