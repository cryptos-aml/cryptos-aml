"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../_components/page-header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          } else {
            // No wallet connected, redirect to home
            router.push("/");
            return;
          }
        } catch (err) {
          console.error("Error checking wallet:", err);
          router.push("/");
          return;
        }
      } else {
        // No MetaMask
        router.push("/");
        return;
      }
      
      setIsChecking(false);
    };

    checkWallet();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto p-6">
        <PageHeader walletAddress={walletAddress} />
        {children}
      </div>
    </div>
  );
}
