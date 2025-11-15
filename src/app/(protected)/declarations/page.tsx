"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { getAllDeclarations } from "../../_actions/declarations";
import { StatusBadge } from "@/components/status-badge";
import { isWhitelisted } from "@/lib/constants";

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
  const [isOwner, setIsOwner] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

            // Check if whitelisted
            const whitelisted = isWhitelisted(wallet);
            setIsOwner(whitelisted);

            // Fetch ALL declarations if whitelisted
            try {
              const data = await getAllDeclarations();
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

  // Refetch when status filter changes
  useEffect(() => {
    if (!walletAddress) return;

    const fetchFiltered = async () => {
      setLoading(true);
      try {
        const filterValue = statusFilter === "all" ? undefined : statusFilter;
        const data = await getAllDeclarations(filterValue);
        setDeclarations(data as Declaration[]);
      } catch (err) {
        console.error("Error fetching declarations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiltered();
  }, [statusFilter, walletAddress]);

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
      <Card className="border-border shadow-2xl">
        <CardHeader className="space-y-4">
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isOwner ? "All Declarations (Owner)" : "Declarations"}
            </CardTitle>
            {walletAddress && (
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {walletAddress}
              </p>
            )}
          </div>

          {/* Filtres centrés */}
          {isOwner && (
            <div className="flex justify-center gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === "executed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("executed")}
              >
                Executed
              </Button>
              <Button
                variant={statusFilter === "failed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("failed")}
              >
                Failed
              </Button>
            </div>
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
                      {/* Left: Amount, Date & Signer */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-lg font-semibold">
                            {(parseFloat(decl.value) / 1000000).toFixed(2)} USDC
                          </p>
                          <StatusBadge
                            status={decl.status}
                            className="text-xs"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(decl.createdAt)}
                        </p>

                        {/* Signer wallet */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            From:
                          </span>
                          <p className="font-mono text-xs text-foreground/80 bg-background/50 px-2 py-0.5 rounded">
                            {decl.owner.slice(0, 6)}...{decl.owner.slice(-4)}
                          </p>
                        </div>

                        {decl.txHash && (
                          <p className="text-xs text-blue-500 font-mono mt-2">
                            {decl.txHash.slice(0, 10)}...{decl.txHash.slice(-8)}
                          </p>
                        )}
                      </div>

                      {/* Right: Arrow */}
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
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
