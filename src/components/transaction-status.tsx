/**
 * Component to display transaction hash and status
 */

import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface TransactionStatusProps {
  txHash: string;
  status: "pending" | "executed" | "failed" | null;
}

export function TransactionStatus({ txHash, status }: TransactionStatusProps) {
  const copyTxHash = () => {
    navigator.clipboard.writeText(txHash);
    toast.success("Transaction Hash copied!");
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        Transaction Hash
        {status === "pending" && (
          <span className="text-xs text-amber-600">⏳ Confirming...</span>
        )}
      </h3>
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs break-all">{txHash}</p>
          <a
            href={`http://localhost:8545/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline mt-1 inline-flex items-center gap-1"
          >
            View on Explorer
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyTxHash}
          className="shrink-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
