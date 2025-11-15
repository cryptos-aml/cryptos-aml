/**
 * EIP-2612 Permit signing for gasless USDC approval
 */

import { ethers } from "ethers";
import { CHAIN_ID, USDC_CONTRACT_ADDRESS } from "@/lib/constants";

/**
 * Sign EIP-2612 Permit for USDC approval (gasless!)
 * @param signer Ethers signer
 * @param spender Address that will spend tokens (AML contract)
 * @param value Amount to approve
 * @param deadline Permit expiration timestamp
 * @returns { v, r, s } signature components
 */
export async function signPermit(
  signer: ethers.Signer,
  spender: string,
  value: string,
  deadline: number
): Promise<{ v: number; r: string; s: string; deadline: number }> {
  const owner = await signer.getAddress();

  // Get current nonce for permit
  const usdcContract = new ethers.Contract(
    USDC_CONTRACT_ADDRESS,
    [
      "function nonces(address owner) view returns (uint256)",
      "function name() view returns (string)",
    ],
    signer
  );

  // Force refresh - no cache
  const provider = signer.provider;
  if (provider) {
    await provider.getBlockNumber(); // Force network call
  }

  const nonce = await usdcContract.nonces(owner);
  const name = await usdcContract.name();

  console.log("🔐 Signing Permit with:");
  console.log(`├─ token: ${name} (version 2)`);
  console.log(`├─ owner: ${owner}`);
  console.log(`├─ spender: ${spender}`);
  console.log(
    `├─ value: ${value} (${(parseFloat(value) / 1000000).toFixed(2)} USDC)`
  );
  console.log(`├─ nonce: ${nonce.toString()}`);
  console.log(`└─ deadline: ${deadline}`);

  // EIP-2612 domain
  const domain = {
    name: name,
    version: "2",
    chainId: CHAIN_ID,
    verifyingContract: USDC_CONTRACT_ADDRESS,
  };

  // EIP-2612 Permit type
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  // Permit message
  const message = {
    owner,
    spender,
    value,
    nonce: nonce.toString(),
    deadline: deadline.toString(),
  };

  // Sign permit (off-chain, 0 gas!)
  const signature = await signer.signTypedData(domain, types, message);

  // Split signature into v, r, s
  const sig = ethers.Signature.from(signature);

  return {
    v: sig.v,
    r: sig.r,
    s: sig.s,
    deadline,
  };
}
