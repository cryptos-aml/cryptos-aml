/**
 * Success summary component after signing
 */

import { CheckCircle } from "lucide-react";

interface SuccessSummaryProps {
  declarationId: string;
  amount: string;
  approvalDone: boolean;
}

export function SuccessSummary({
  declarationId,
  amount,
  approvalDone,
}: SuccessSummaryProps) {
  return (
    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md space-y-2">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-500" />
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
          <span className="font-mono text-xs">{declarationId}</span>
        </p>
        {approvalDone && (
          <p className="text-green-600 dark:text-green-400 font-medium">
            ✓ USDC spending approved
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Your declaration has been signed and saved. The USDC approval is ready
        for execution.
      </p>
    </div>
  );
}
