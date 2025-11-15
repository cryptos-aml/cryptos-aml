"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, ExternalLink, Send, ArrowLeft } from "lucide-react";
import { ethers } from "ethers";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { updateDeclarationTransaction } from "@/app/_actions/declarations";

import {
  AML_CONTRACT_ADDRESS,
  USDC_CONTRACT_ADDRESS,
  CHAIN_ID,
} from "@/lib/constants";

// ABI minimal pour transferTokens
const AML_ABI = [
  "function transferTokens(address signer, address to, uint256 amount, uint256 nonce, bytes signature) external",
];

// ABI minimal pour USDC ERC20
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

interface Declaration {
  _id: string;
  owner: string;
  to: string;
  value: string;
  signature: string;
  nonce: string;
  status: string;
  createdAt: string;
  txHash?: string | null;
}

interface Props {
  declaration: Declaration;
}

export function DeclarationClient({ declaration }: Props) {
  const router = useRouter();
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [txStatus, setTxStatus] = useState<
    "pending" | "executed" | "failed" | null
  >(declaration.status === "pending" && declaration.txHash ? "pending" : null);

  // Poll transaction status if there's a pending tx
  useEffect(() => {
    if (!declaration.txHash || declaration.status !== "pending") return;

    const checkTxStatus = async () => {
      if (!window.ethereum) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const receipt = await provider.getTransactionReceipt(
          declaration.txHash!
        );

        if (receipt) {
          const newStatus = receipt.status === 1 ? "executed" : "failed";
          await updateDeclarationTransaction(
            declaration._id,
            declaration.txHash!,
            newStatus
          );
          setTxStatus(newStatus);

          if (newStatus === "executed") {
            toast.success("Transaction confirmed!");
          } else {
            toast.error("Transaction failed!");
          }

          router.refresh();
        }
      } catch (error) {
        console.error("Error checking tx status:", error);
      }
    };

    checkTxStatus();

    const interval = setInterval(checkTxStatus, 5000);

    return () => clearInterval(interval);
  }, [declaration.txHash, declaration.status, declaration._id, router]);

  const executeTransfer = async () => {
    if (!window.ethereum) return;

    let approveToast: string | number | undefined;
    let waitApproveToast: string | number | undefined;
    let transferToast: string | number | undefined;
    let waitToast: string | number | undefined;

    try {
      setExecuting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Check network
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      if (chainId !== CHAIN_ID) {
        toast.error(`Wrong network. Please switch to Chain ID ${CHAIN_ID}`);
        return;
      }

      // Validate contract addresses
      if (!USDC_CONTRACT_ADDRESS || !AML_CONTRACT_ADDRESS) {
        toast.error("Contract addresses not configured");
        return;
      }

      // Check USDC allowance and approve if needed
      const usdcContract = new ethers.Contract(
        USDC_CONTRACT_ADDRESS,
        ERC20_ABI,
        signer
      );

      const allowance = await usdcContract.allowance(
        declaration.owner,
        AML_CONTRACT_ADDRESS
      );

      // Only approve if allowance is insufficient
      if (allowance < BigInt(declaration.value)) {
        approveToast = toast.loading("Approving USDC (one-time setup)...");

        // Approve max uint256 for unlimited allowance
        const MAX_UINT256 =
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        const approveTx = await usdcContract.approve(
          AML_CONTRACT_ADDRESS,
          MAX_UINT256
        );

        toast.dismiss(approveToast);
        waitApproveToast = toast.loading(
          "Waiting for approval confirmation..."
        );
        await approveTx.wait();

        toast.dismiss(waitApproveToast);
        waitApproveToast = undefined;
        toast.success("USDC approved!", {
          duration: 3000,
        });
      }

      // Execute the transfer
      const contract = new ethers.Contract(
        AML_CONTRACT_ADDRESS,
        AML_ABI,
        signer
      );

      transferToast = toast.loading("Executing transfer...");

      // Log transaction details for MetaMask preview
      console.log("🔐 Executing transferTokens() with:");
      console.log(
        "├─ Function: transferTokens(address,address,uint256,uint256,bytes)"
      );
      console.log(`├─ signer: ${declaration.owner}`);
      console.log(`├─ to: ${declaration.to}`);
      console.log(
        `├─ amount: ${(parseFloat(declaration.value) / 1000000).toFixed(
          2
        )} USDC (${declaration.value} wei)`
      );
      console.log(`├─ nonce: ${declaration.nonce}`);
      console.log(`└─ signature: ${declaration.signature.slice(0, 20)}...`);

      const tx = await contract.transferTokens(
        declaration.owner,
        declaration.to,
        declaration.value,
        declaration.nonce,
        declaration.signature
      );

      const txHash = tx.hash;
      toast.dismiss(transferToast);
      transferToast = undefined;

      await updateDeclarationTransaction(declaration._id, txHash);
      setTxStatus("pending");

      waitToast = toast.loading(
        `Transaction sent! Hash: ${txHash.slice(0, 10)}...`
      );

      const receipt = await tx.wait();

      toast.dismiss(waitToast);
      waitToast = undefined;

      if (receipt.status === 1) {
        await updateDeclarationTransaction(declaration._id, txHash, "executed");
        setTxStatus("executed");
        toast.success("Transfer executed successfully!", { duration: 3000 });
      } else {
        await updateDeclarationTransaction(declaration._id, txHash, "failed");
        setTxStatus("failed");
        toast.error("Transaction failed!");
      }

      // Reload page to refresh status
      router.refresh();
    } catch (error: unknown) {
      console.error("Error executing transfer:", error);
      const message =
        error instanceof Error ? error.message : "Failed to execute transfer";
      toast.error(message);
    } finally {
      // Dismiss all loading toasts if still active
      if (approveToast) toast.dismiss(approveToast);
      if (waitApproveToast) toast.dismiss(waitApproveToast);
      if (transferToast) toast.dismiss(transferToast);
      if (waitToast) toast.dismiss(waitToast);
      setExecuting(false);
    }
  };

  const openEtherscan = () => {
    const etherscanBase =
      CHAIN_ID === 1
        ? "https://etherscan.io"
        : CHAIN_ID === 31337
        ? "http://localhost:8545" // Hardhat local - direct RPC
        : "https://sepolia.etherscan.io";

    const etherscanUrl = `${etherscanBase}/address/${AML_CONTRACT_ADDRESS}#writeContract#F3`;
    window.open(etherscanUrl, "_blank");
  };

  const copyAllParams = () => {
    const text = `signer: ${declaration.owner}
to: ${declaration.to}
amount: ${declaration.value}
nonce: ${declaration.nonce}
signature: ${declaration.signature}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("All parameters copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyParam = (value: string, name: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${name} copied!`);
  };

  return (
    <>
      <div className="flex justify-start mb-4">
        <Button
          variant="outline"
          onClick={() => router.push("/declarations")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="border-border shadow-2xl gap-0">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Declaration</CardTitle>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={declaration.status} />
              <span className="text-xs text-muted-foreground">
                {new Date(declaration.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contract Call Parameters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Contract Call Parameters
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAllParams}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy All
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Use these parameters to call{" "}
              <code className="bg-muted px-1 py-0.5 rounded">
                transferTokens()
              </code>{" "}
              on the contract
            </p>

            {/* Parameters Display */}
            <div className="space-y-2">
              {/* Signer */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    signer (address)
                  </p>
                  <p className="font-mono text-xs break-all">
                    {declaration.owner}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyParam(declaration.owner, "Signer")}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* To */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    to (address)
                  </p>
                  <p className="font-mono text-xs break-all">
                    {declaration.to}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyParam(declaration.to, "To")}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Amount */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    amount (uint256)
                  </p>
                  <p className="font-mono text-xs break-all">
                    {declaration.value}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyParam(declaration.value, "Amount")}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Nonce */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    nonce (uint256)
                  </p>
                  <p className="font-mono text-xs break-all">
                    {declaration.nonce}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyParam(declaration.nonce, "Nonce")}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Signature */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    signature (bytes)
                  </p>
                  <p className="font-mono text-xs break-all">
                    {declaration.signature}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyParam(declaration.signature, "Signature")}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-yellow-500 italic flex items-start gap-1">
              <span>💡</span>
              <span>
                Copy these parameters to execute the transfer on Etherscan or
                your contract interface
              </span>
            </p>
          </div>

          {/* Transaction Hash - if exists */}
          {declaration.txHash && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  Transaction Hash
                  {txStatus === "pending" && (
                    <span className="text-xs text-amber-600">
                      ⏳ Confirming...
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs break-all">
                      {declaration.txHash}
                    </p>
                    <a
                      href={`http://localhost:8545/tx/${declaration.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      View on Explorer
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyParam(declaration.txHash!, "Transaction Hash")
                    }
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={executeTransfer}
              disabled={executing}
              className="w-full h-12 gap-2"
              size="lg"
            >
              <Send className="h-5 w-5" />
              {executing ? "Executing..." : "Execute Transfer Now"}
            </Button>

            <Button
              onClick={openEtherscan}
              variant="outline"
              className="w-full h-12 gap-2"
              size="lg"
            >
              <ExternalLink className="h-5 w-5" />
              Execute Manually on Etherscan
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-muted-foreground text-xs mt-4">
        Secured by cryptographic signatures • Zero gas fees • Instant
        verification
      </p>
    </>
  );
}
