"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { WalletBalance } from "@/components/wallet-balance";
import { AmountInput } from "@/components/sign/amount-input";
import { AmlDeclarationDisplay } from "@/components/sign/aml-declaration-display";
import { WalletInfoDisplay } from "@/components/sign/wallet-info-display";
import { SuccessSummary } from "@/components/sign/success-summary";
import { signDeclarationWithApproval } from "@/lib/blockchain/sign-declaration";
import { toast } from "sonner";

export default function SignPage() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [successData, setSuccessData] = useState<{
    declarationId: string;
    amount: string;
    approvalDone: boolean;
  } | null>(null);

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

  const handleSign = async () => {
    setLoading(true);
    setError("");
    setSuccessData(null);

    const result = await signDeclarationWithApproval({
      walletAddress,
      amount,
    });

    if (result.success) {
      toast.success("Declaration signed successfully!", { duration: 3000 });
      if (result.needsApproval && result.error) {
        toast.warning(result.error, { duration: 5000 });
      }

      // Store success data for summary
      setSuccessData({
        declarationId: result.declarationId || "N/A",
        amount: amount,
        approvalDone: !result.needsApproval,
      });

      // Clear form
      setAmount("");
    } else {
      setError(result.error || "Failed to sign declaration");
      toast.error(result.error || "Failed to sign declaration");
    }

    setLoading(false);
  };

  return (
    <>
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
          <WalletInfoDisplay walletAddress={walletAddress} />

          <WalletBalance />

          <Separator />

          <AmountInput
            amount={amount}
            onChange={setAmount}
            disabled={loading}
          />

          <Separator />

          <AmlDeclarationDisplay />

          <Button
            onClick={handleSign}
            disabled={loading || !walletAddress || !amount}
            className="w-full h-12"
            size="lg"
          >
            {loading ? "Signing..." : "Sign AML Declaration"}
          </Button>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {successData && (
            <SuccessSummary
              declarationId={successData.declarationId}
              amount={successData.amount}
              approvalDone={successData.approvalDone}
            />
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
