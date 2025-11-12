"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./_components/theme-toggle";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const isMetaMaskInstalled =
    typeof window !== "undefined" && typeof window.ethereum !== "undefined";

  const connectWallet = async () => {
    if (!isMetaMaskInstalled) {
      setError(
        "MetaMask is not installed. Please install MetaMask to continue."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts.length > 0) {
        // Connected successfully, redirect to sign page
        router.push("/sign");
      }
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-start mb-4">
          <ThemeToggle />
        </div>

        <Card className="border-border shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-3xl font-bold text-center">
              AML Declaration
            </CardTitle>
            <p className="text-center text-muted-foreground text-sm">
              Sign your Anti-Money Laundering declaration on-chain
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Connect your wallet to get started
              </p>

              <Button
                onClick={connectWallet}
                disabled={loading || !isMetaMaskInstalled}
                className="w-full h-12"
                size="lg"
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </Button>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {!isMetaMaskInstalled && (
                <div className="p-3 bg-muted border border-border rounded-md">
                  <p className="text-sm text-muted-foreground">
                    MetaMask is not installed.{" "}
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Install MetaMask
                    </a>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground text-xs mt-4">
          Secured by cryptographic signatures • Zero gas fees • Instant
          verification
        </p>
      </div>
    </div>
  );
}
