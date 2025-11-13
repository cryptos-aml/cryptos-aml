// https://etherscan.io/address/0x1ac81980e946a1a97e201fe59390ec13e84f3173#code
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract amlChain is Ownable {
    IERC20 public token;

    constructor(address _tokenAddress) Ownable(msg.sender) {
        token = IERC20(_tokenAddress);
    }

    function transferTokens(address signer, address to, uint256 amount, uint256 nonce, bytes memory signature) public {
        // Verify the signature
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encodePacked("Transfer", to, amount, nonce))));
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        address recoveredAddress = ecrecover(hash, v, r, s);

        require(recoveredAddress != address(0), "Invalid signature");
        require(recoveredAddress == signer, "Signature does not match signer");

        // Verify the hash
        bytes32 expectedHash = keccak256(abi.encodePacked(to, amount, nonce));
        require(keccak256(abi.encodePacked(to, amount, nonce)) == expectedHash, "Hash mismatch");

        // Transfer tokens
        token.transferFrom(signer, to, amount);
    }

    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}