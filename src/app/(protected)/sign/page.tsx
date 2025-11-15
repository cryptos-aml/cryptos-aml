"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { createDeclaration } from "../../_actions/declarations";
import {
  AML_DECLARATION_TEXT,
  AML_CONTRACT_ADDRESS,
  VAULT_ADDRESS,
} from "@/lib/constants";
import { signAMLDeclaration } from "@/lib/eip712";
import { usdcToUnits } from "@/lib/constants";
import { WalletBalance } from "@/components/wallet-balance";
import { toast } from "sonner";

export default function SignPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Get wallet address on mount
  useEffect(() => {
    const getWallet = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (err) {
          console.error("Error getting wallet:", err);
        }
      }
    };

    getWallet();
  }, []);

  const signDeclaration = async () => {
    if (!walletAddress || !amount) {
      setError("Please fill in all required fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Convert amount to USDC units (6 decimals)
      const amountUnits = usdcToUnits(amount);

      // Generate nonce (timestamp)
      const nonce = Date.now().toString();

      // Sign using EIP-712
      const signature = await signAMLDeclaration(
        signer,
        AML_CONTRACT_ADDRESS,
        amountUnits,
        nonce
      );

      // Save to database
      const loadingToast = toast.loading("Creating declaration...");
      const data = await createDeclaration({
        owner: walletAddress,
        to: VAULT_ADDRESS,
        value: amountUnits,
        signature,
        nonce: nonce, // Same nonce used for signature
      });

      // Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success("Declaration created successfully!", {
        duration: 2000,
      });

      // Clear form
      setAmount("");

      // Redirect immediately after success
      router.push(`/declarations/${data.id}`);

      console.log("Declaration signed successfully:", data);
    } catch (err) {
      console.error("Error signing declaration:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to sign declaration. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-start mb-4">
        <Button
          variant="outline"
          onClick={() => router.push("/declarations")}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          My declarations
        </Button>
      </div>

      <Card className="border-border shadow-2xl">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-3xl font-bold text-center">
            AML Declaration
          </CardTitle>
          <p className="text-center text-muted-foreground text-sm">
            Sign your Anti-Money Laundering declaration for USDC transfers
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Wallet Info */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Connected Wallet
            </Label>
            <div className="p-3 bg-muted border border-border rounded-md">
              <p className="font-mono text-sm break-all">{walletAddress}</p>
            </div>
          </div>

          {/* Balance */}
          <WalletBalance />

          <Separator />

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter USDC amount (e.g., 100.50)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Enter the amount of USDC to transfer (6 decimals)
            </p>
          </div>
          {/* 
          <div className="space-y-2">
            <Label>Destination (Vault)</Label>
            <div className="p-3 bg-muted border border-border rounded-md">
              <p className="font-mono text-sm break-all">{VAULT_ADDRESS}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              All USDC transfers go to the vault address
            </p>
          </div> */}

          <Separator />

          {/* AML Declaration Text */}
          <div className="space-y-2">
            <Label htmlFor="declaration">AML Declaration</Label>
            <Textarea
              id="declaration"
              value={AML_DECLARATION_TEXT}
              readOnly
              rows={6}
              className="resize-none font-mono text-xs"
            />
          </div>

          {/* Sign Button */}
          <Button
            onClick={signDeclaration}
            disabled={loading || !walletAddress || !amount}
            className="w-full h-12"
            size="lg"
          >
            {loading ? "Signing..." : "Sign AML Declaration"}
          </Button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-muted-foreground text-xs mt-4">
        Secured by cryptographic signatures • Zero gas fees • Instant
        verification
      </p>
    </>
  );
}
