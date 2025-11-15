"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Card } from "@/components/ui/card";
import { Wallet, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "";
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID
  ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID)
  : 1;

// ERC20 ABI minimal (just balanceOf)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export function WalletBalance() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [ethBalance, setEthBalance] = useState<string>("0");
  const [usdcBalance, setUsdcBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);

  const switchNetwork = async () => {
    if (!window.ethereum) return;

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${CHAIN_ID.toString(16)}`,
                chainName: "Hardhat Local",
                rpcUrls: ["http://localhost:8545"],
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          console.error("Error adding network:", addError);
        }
      } else {
        console.error("Error switching network:", error);
      }
    }
  };

  const fetchBalances = async () => {
    if (!walletAddress || !window.ethereum) return;

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Check current network
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      setCurrentChainId(chainId);

      // Check if on wrong network
      if (chainId !== CHAIN_ID) {
        setWrongNetwork(true);
      } else {
        setWrongNetwork(false);
      }

      // Get ETH balance
      const ethBal = await provider.getBalance(walletAddress);
      setEthBalance(ethers.formatEther(ethBal));

      // Get USDC balance (if address configured)
      if (
        USDC_ADDRESS &&
        USDC_ADDRESS !== "0x0000000000000000000000000000000000000000"
      ) {
        const usdcContract = new ethers.Contract(
          USDC_ADDRESS,
          ERC20_ABI,
          provider
        );
        const usdcBal = await usdcContract.balanceOf(walletAddress);
        setUsdcBalance(ethers.formatUnits(usdcBal, 6)); // USDC has 6 decimals
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setLoading(false);
    }
  };

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

  // Fetch balances when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      fetchBalances();
    }
  }, [walletAddress]);

  if (!walletAddress) {
    return null;
  }

  const formatBalance = (balance: string, decimals: number = 4) => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  };

  return (
    <Card className="p-3 bg-linear-to-br from-background to-muted/20 border-border gap-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Your Balances</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchBalances}
          disabled={loading}
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Wrong Network Warning */}
      {wrongNetwork && currentChainId !== null && (
        <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div>
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                  Wrong Network
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500">
                  Connected to Chain ID {currentChainId}. Expected: {CHAIN_ID}
                </p>
              </div>
              <Button
                size="sm"
                onClick={switchNetwork}
                className="h-7 text-xs w-full"
                variant="outline"
              >
                Switch to Hardhat Local
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* ETH Balance */}
        <div className="flex items-center justify-between p-2 rounded-md bg-background/50">
          <span className="text-sm font-medium">ETH</span>
          <span className="font-mono text-sm font-semibold">
            {formatBalance(ethBalance, 4)}
          </span>
        </div>

        {/* USDC Balance */}
        {USDC_ADDRESS &&
          USDC_ADDRESS !== "0x0000000000000000000000000000000000000000" && (
            <div className="flex items-center justify-between p-2 rounded-md bg-background/50">
              <span className="text-sm font-medium">USDC</span>
              <span className="font-mono text-sm font-semibold">
                {formatBalance(usdcBalance, 2)}
              </span>
            </div>
          )}
      </div>

      {/* Network info */}
      <div className="mt-2 pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          {currentChainId !== null ? (
            <>
              Chain ID: {currentChainId}
              {currentChainId !== CHAIN_ID && (
                <span className="text-yellow-500"> (Expected: {CHAIN_ID})</span>
              )}
            </>
          ) : (
            <>Chain ID: {CHAIN_ID}</>
          )}
        </p>
      </div>
    </Card>
  );
}
