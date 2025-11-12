"use client";

import { useMemo } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

interface DeclarationHistoryProps {
  declarations: Declaration[];
  loading: boolean;
  onOpen: () => void;
}

export function DeclarationHistory({
  declarations,
  loading,
  onOpen,
}: DeclarationHistoryProps) {
  // eslint-disable-next-line
  const currentTimestamp = useMemo(() => Math.floor(Date.now() / 1000), []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusVariant = (status: string, deadline: number) => {
    // Check if expired
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
    // Check if expired
    if (status === "pending" && deadline < currentTimestamp) {
      return "EXPIRED";
    }
    return status.toUpperCase();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" onClick={onOpen}>
          View My Declarations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your AML Declarations</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : declarations.length === 0 ? (
            <Card className="bg-muted/30 border-border">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No declarations found
              </CardContent>
            </Card>
          ) : (
            declarations.map((decl) => (
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
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
