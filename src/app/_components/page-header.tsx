"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, PenTool } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { WalletDisconnect } from "./wallet-disconnect";
import { isWhitelisted } from "@/lib/constants";

interface PageHeaderProps {
  walletAddress?: string;
}

export function PageHeader({ walletAddress }: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const showDeclarations = walletAddress && isWhitelisted(walletAddress);

  const handleDisconnect = () => {
    // Force redirect to home and reload to reset state
    window.location.href = "/";
  };

  return (
    <div className="flex justify-between items-center gap-2 mb-4">
      {/* Navigation - Left */}
      <div className="flex gap-2">
        <Button
          variant={pathname === "/sign" ? "default" : "outline"}
          onClick={() => router.push("/sign")}
          className="gap-2"
        >
          <PenTool className="h-4 w-4" />
          Sign
        </Button>

        {showDeclarations && (
          <Button
            variant={pathname === "/declarations" ? "default" : "outline"}
            onClick={() => router.push("/declarations")}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Declarations
          </Button>
        )}
      </div>

      {/* Controls - Right */}
      <div className="flex gap-2">
        <ThemeToggle />
        {walletAddress && <WalletDisconnect onDisconnect={handleDisconnect} />}
      </div>
    </div>
  );
}
