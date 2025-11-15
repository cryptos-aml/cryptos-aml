/**
 * Wallet info display component
 */

import { Label } from "@/components/ui/label";
// import { VAULT_ADDRESS } from "@/lib/constants";

interface WalletInfoDisplayProps {
  walletAddress: string;
}

export function WalletInfoDisplay({ walletAddress }: WalletInfoDisplayProps) {
  return (
    <>
      {/* Connected Wallet */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Connected Wallet
        </Label>
        <div className="p-3 bg-muted border border-border rounded-md">
          <p className="font-mono text-sm break-all">{walletAddress}</p>
        </div>
      </div>

      {/* Vault Address (Read-only) */}
      {/* <div className="space-y-2">
        <Label>Destination (Vault)</Label>
        <div className="p-3 bg-muted/50 border border-border rounded-md">
          <p className="font-mono text-sm break-all text-muted-foreground">
            {VAULT_ADDRESS}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          All transfers go to the vault address
        </p>
      </div> */}
    </>
  );
}
