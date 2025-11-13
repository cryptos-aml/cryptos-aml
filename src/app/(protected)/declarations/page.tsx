"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenIcon, ChevronRight } from "lucide-react";
import { getDeclarationsByWallet } from "../../_actions/declarations";
import { StatusBadge } from "@/components/status-badge";

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
  txHash?: string | null;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            <div className="space-y-3">
              {declarations.map((decl) => (
                <Card
                  key={decl._id}
                  className="bg-muted/50 border-border hover:bg-muted/70 transition-colors cursor-pointer"
                  onClick={() => router.push(`/declarations/${decl._id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Amount & Status */}
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-lg font-semibold">
                            {(parseFloat(decl.value) / 1000000).toFixed(2)} USDC
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(decl.createdAt)}
                          </p>
                          {decl.txHash && (
                            <p className="text-xs text-blue-500 font-mono mt-1">
                              {decl.txHash.slice(0, 10)}...{decl.txHash.slice(-8)}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={decl.status} className="text-xs" />
                      </div>

                      {/* Right: Signature & Arrow */}
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-xs text-muted-foreground">
                          {decl.signature.slice(0, 10)}...{decl.signature.slice(-8)}
                        </p>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
