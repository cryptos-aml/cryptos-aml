"use client";

import { ThemeToggle } from "./theme-toggle";
import { WalletDisconnect } from "./wallet-disconnect";

interface PageHeaderProps {
  walletAddress?: string;
}

export function PageHeader({ walletAddress }: PageHeaderProps) {
  const handleDisconnect = () => {
    // Force redirect to home and reload to reset state
    window.location.href = "/";
  };

  return (
    <div className="flex justify-start gap-2 mb-4">
      {walletAddress && (
        <WalletDisconnect onDisconnect={handleDisconnect} />
      )}
      <ThemeToggle />
    </div>
  );
}
