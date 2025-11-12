"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PenIcon } from "lucide-react";
import { getDeclarationsByWallet } from "../../_actions/declarations";

interface Declaration {
  _id: string;
  owner: string;
  to: string;
  value: string;
  payloadHash: string;
  signature: string;
  status: string;
  createdAt: string;
  nonce: string;
  deadline: number;
}

export default function DeclarationsPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });

          if (accounts.length > 0) {
            const wallet = accounts[0];
            setWalletAddress(wallet);

            // Fetch declarations
            try {
              const data = await getDeclarationsByWallet(wallet);
              setDeclarations(data as Declaration[]);
            } catch (err) {
              console.error("Error fetching declarations:", err);
              setError("Failed to load declarations");
            }
          }
        } catch (err) {
          console.error("Error getting wallet:", err);
        }
      }

      setLoading(false);
    };

    init();
  }, []);

  // Calculate timestamp once
  // eslint-disable-next-line
  const currentTimestamp = Math.floor(Date.now() / 1000);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusVariant = (status: string, deadline: number) => {
    if (status === "pending" && deadline < currentTimestamp) {
      return "destructive" as const;
    }

    switch (status) {
      case "executed":
        return "default" as const;
      case "failed":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusText = (status: string, deadline: number) => {
    if (status === "pending" && deadline < currentTimestamp) {
      return "EXPIRED";
    }
    return status.toUpperCase();
  };

  return (
    <>
      <div className="flex justify-start mb-4">
        <Button
          variant="outline"
          onClick={() => router.push("/sign")}
          className="gap-2"
        >
          <PenIcon className="h-4 w-4" />
          Sign new declaration
        </Button>
      </div>

      <Card className="border-border shadow-2xl">
        <CardHeader>
          <CardTitle>My AML Declarations</CardTitle>
          {walletAddress && (
            <p className="text-sm text-muted-foreground font-mono">
              {walletAddress}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              Loading declarations...
            </p>
          ) : error ? (
            <p className="text-center text-destructive py-8">{error}</p>
          ) : declarations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No declarations found
            </p>
          ) : (
            <div className="space-y-4">
              {declarations.map((decl) => (
                <Card key={decl._id} className="bg-muted/50 border-border">
                  <CardContent className="pt-3 pb-3 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <Badge
                        variant={getStatusVariant(decl.status, decl.deadline)}
                        className="text-xs"
                      >
                        {getStatusText(decl.status, decl.deadline)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(decl.createdAt)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs mb-0.5">
                          Amount
                        </p>
                        <p className="font-medium">
                          {ethers.formatEther(decl.value)} ETH
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs mb-0.5">
                          Vault
                        </p>
                        <p className="font-mono text-xs">
                          {formatAddress(decl.to)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs mb-0.5">
                          Payload Hash
                        </p>
                        <p className="font-mono text-xs break-all">
                          {decl.payloadHash}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs mb-0.5">
                          Signature
                        </p>
                        <p className="font-mono text-xs break-all">
                          {decl.signature}
                        </p>
                      </div>
                      <div className="col-span-2 text-right">
                        <p className="text-muted-foreground text-xs mb-0.5">
                          Nonce
                        </p>
                        <p className="font-mono text-xs">{decl.nonce}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
