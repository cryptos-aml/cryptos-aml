"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WalletInfo } from "../../_components/wallet-info";
import { DeclarationForm } from "../../_components/declaration-form";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { createDeclaration } from "../../_actions/declarations";
import { VAULT_ADDRESS, AML_DECLARATION_TEXT } from "@/lib/constants";

const DEFAULT_VAULT_ADDRESS = VAULT_ADDRESS;

export default function SignPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [vaultAddress, setVaultAddress] = useState<string>(
    DEFAULT_VAULT_ADDRESS
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>("");
  const [payloadHash, setPayloadHash] = useState<string>("");

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
      setSuccess(false);

      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Fetch signing parameters from server
      const paramsResponse = await fetch("/api/sign-params");
      if (!paramsResponse.ok) {
        throw new Error("Failed to get signing parameters");
      }

      const params = await paramsResponse.json();
      const { domain, types, message } = params;

      // Override owner with current wallet
      message.owner = walletAddress;

      // Sign with EIP-712
      const signature = await signer.signTypedData(domain, types, message);

      // Convert amount to wei
      const valueInWei = ethers.parseEther(amount).toString();

      // Submit to server with minimal data
      const data = await createDeclaration({
        owner: walletAddress,
        value: valueInWei,
        signature,
        nonce: message.nonce,
        deadline: message.deadline,
      });

      setPayloadHash(data.payloadHash);
      setSuccess(true);
      setAmount("");
    } catch (err) {
      console.error("Error signing declaration:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to sign declaration. Please try again.");
      }
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
            Sign your Anti-Money Laundering declaration on-chain
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <WalletInfo address={walletAddress} />
          <Separator />
          <DeclarationForm
            amount={amount}
            vaultAddress={vaultAddress}
            declarationText={AML_DECLARATION_TEXT}
            onAmountChange={setAmount}
            onVaultAddressChange={setVaultAddress}
            onSubmit={signDeclaration}
            loading={loading}
            error={error}
            success={success}
            payloadHash={payloadHash}
          />
        </CardContent>
      </Card>

      <p className="text-center text-muted-foreground text-xs mt-4">
        Secured by cryptographic signatures • Zero gas fees • Instant
        verification
      </p>
    </>
  );
}
