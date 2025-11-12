"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WalletConnectProps {
  onConnect: () => Promise<void>;
  loading: boolean;
  error: string;
  isMetaMaskInstalled: boolean;
}

export function WalletConnect({
  onConnect,
  loading,
  error,
  isMetaMaskInstalled,
}: WalletConnectProps) {
  return (
    <div className="space-y-4 text-center pt-6">
      <p className="text-muted-foreground">
        Connect your wallet to get started
      </p>

      {!isMetaMaskInstalled && (
        <Alert variant="destructive">
          <AlertDescription>
            MetaMask is not installed.{" "}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              Install MetaMask
            </a>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={onConnect}
        disabled={loading || !isMetaMaskInstalled}
        className="w-full max-w-xs"
        size="lg"
      >
        {loading ? "Connecting..." : "Connect Wallet"}
      </Button>
    </div>
  );
}
