"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun, FileText, PenTool } from "lucide-react";
import { useTheme } from "next-themes";
import { isWhitelisted } from "@/lib/constants";

interface AppHeaderProps {
  walletAddress?: string;
}

export function AppHeader({ walletAddress }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const showDeclarations = walletAddress && isWhitelisted(walletAddress);

  const handleDisconnect = () => {
    // Force redirect to home and reload to reset state
    window.location.href = "/";
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        {/* Navigation - Left side */}
        <nav className="flex items-center gap-2">
          <Button
            variant={pathname === "/sign" ? "default" : "ghost"}
            onClick={() => router.push("/sign")}
            className="gap-2"
          >
            <PenTool className="h-4 w-4" />
            Sign
          </Button>

          {showDeclarations && (
            <Button
              variant={pathname === "/declarations" ? "default" : "ghost"}
              onClick={() => router.push("/declarations")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Declarations
            </Button>
          )}
        </nav>

        {/* Controls - Right side */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDisconnect}
            title="Disconnect wallet"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
