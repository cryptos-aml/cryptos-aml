# AML Declaration Platform

Web3 application for signing Anti-Money Laundering declarations on-chain using EIP-712 signatures.

## Overview

This platform allows crypto investors to sign AML declarations before depositing funds with an asset manager. The flow includes:

1. **Client connects wallet** (MetaMask)
2. **Signs AML declaration** via EIP-712 (off-chain, 0 gas fees)
3. **Signature stored** in MongoDB with metadata
4. **External operator** retrieves data via API for on-chain submission

## Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **UI**: shadcn/ui + Tailwind CSS (dark theme)
- **Web3**: ethers.js v6 for EIP-712 signatures
- **Database**: MongoDB with Mongoose
- **Deploy**: Vercel-ready

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main page component
│   ├── _actions/
│   │   └── declarations.ts         # Server actions for declarations
│   ├── _components/
│   │   ├── wallet-connect.tsx      # Wallet connection component
│   │   ├── wallet-info.tsx         # Connected wallet display
│   │   ├── declaration-form.tsx    # AML declaration form
│   │   └── declaration-history.tsx # Declarations history modal
│   └── api/
│       └── declarations/
│           ├── route.ts            # POST - Create new declaration
│           └── [wallet]/
│               └── route.ts        # GET - Fetch declarations by wallet
├── lib/
│   ├── mongodb.ts                  # MongoDB connection & Mongoose schema
│   ├── crypto.ts                   # PayloadHash calculation logic
│   └── types.ts                    # TypeScript interfaces
├── components/
│   └── ui/                         # shadcn/ui components
└── types/
    └── window.d.ts                 # Window.ethereum types
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and pnpm
- MetaMask browser extension
- MongoDB Atlas account (or local MongoDB instance)

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd cryptos-aml

# Install dependencies
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

See `env.example` for reference.

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

Add `MONGODB_URI` to your Vercel environment variables.

## Features

### ✅ Implemented

- **Wallet Connection**: MetaMask integration with ethers.js v6
- **EIP-712 Signature**: Off-chain signing (no gas fees)
- **MongoDB Storage**: Declaration persistence with schema validation
- **Server Actions**: Next.js 14 server actions for type-safe backend calls
  - `createDeclaration` - Create new declaration
  - `getDeclarationsByWallet` - Fetch declarations by wallet
- **API Endpoints** (legacy, can be removed): 
  - `POST /api/declarations` - Create new declaration
  - `GET /api/declarations/[wallet]` - Fetch declarations by wallet
- **Component Architecture**: Modular, reusable components in `_components/`
- **shadcn/ui**: Full integration with primary/secondary theme colors
- **Declaration History**: View past declarations with status badges
- **Error Handling**: Comprehensive validation and error messages

### 📋 Pending Client Input

The following items are marked with `TODO` comments in the code:

- [ ] **EIP-712 Structure**: Confirm exact domain, types, and message format to match smart contract
- [ ] **PayloadHash Logic**: Provide actual compliance data calculation (currently uses placeholder)
- [ ] **Vault Address**: Provide the correct vault destination address
- [ ] **AML Declaration Text**: Confirm the exact legal text to display
- [ ] **Nonce Management**: Decide on nonce strategy (fixed vs. incremental per wallet)
- [ ] **Deadline Duration**: Confirm default expiration period (currently 30 days)
- [ ] **ChainID**: Confirm target network (currently Ethereum Mainnet)

## API Reference

### Public Endpoints

#### POST /api/declarations

Create a new AML declaration.

**Request Body:**
```json
{
  "owner": "0x...",
  "to": "0x...",
  "value": "1000000000000000000",
  "message": "I hereby declare that...",
  "signature": "0x...",
  "nonce": 1,
  "deadline": 1735689600
}
```

**Response:**
```json
{
  "id": "60d5ec49f1b2c8b1f8e4e1a1",
  "status": "pending",
  "payloadHash": "0x..."
}
```

### GET /api/declarations/[wallet]

Fetch all declarations for a wallet address.

**Response:**
```json
[
  {
    "_id": "60d5ec49f1b2c8b1f8e4e1a1",
    "owner": "0x...",
    "to": "0x...",
    "value": "1000000000000000000",
    "payloadHash": "0x...",
    "signature": "0x...",
    "nonce": 1,
    "deadline": 1735689600,
    "status": "pending",
    "createdAt": "2024-06-25T12:00:00.000Z",
    "executedAt": null,
    "txHash": null
  }
]
```

### Operator Endpoints

**Authentication Required**: All operator endpoints require an API token in the `Authorization` header.

#### POST /api/declarations/mark-executed

Mark a declaration as executed using its nonce.

**Headers:**
```
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "nonce": "PaqCmio4RTr",
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

**Response:**
```json
{
  "success": true,
  "declaration": {
    "id": "...",
    "nonce": "PaqCmio4RTr",
    "status": "executed",
    "txHash": "0x...",
    "executedAt": "2025-11-12T17:35:00.000Z"
  }
}
```

#### POST /api/declarations/mark-failed

Mark a declaration as failed using its nonce.

**Headers:**
```
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "nonce": "PaqCmio4RTr",
  "txHash": "0x..." // Optional
}
```

**Response:**
```json
{
  "success": true,
  "declaration": {
    "id": "...",
    "nonce": "PaqCmio4RTr",
    "status": "failed",
    "txHash": null
  }
}
```

**See [OPERATOR.md](./OPERATOR.md) for detailed operator documentation.**

## MongoDB Schema

```typescript
{
  owner: String,           // Wallet address (indexed)
  to: String,              // Vault address
  value: String,           // Amount in wei
  payloadHash: String,     // Compliance data hash
  signature: String,       // EIP-712 signature
  nonce: Number,           // Replay protection
  deadline: Number,        // Unix timestamp
  status: String,          // "pending" | "executed" | "failed"
  createdAt: Date,         // Auto timestamp
  executedAt: Date,        // Execution timestamp (nullable)
  txHash: String          // On-chain tx hash (nullable)
}
```

## Security Notes

- **V1 Limitation**: Backend does NOT verify signatures (operator handles this via smart contract)
- **Nonce**: Currently fixed at `1` - implement incremental nonces for production
- **ChainID**: Hardcoded to Ethereum Mainnet - adjust for testnet/other chains
- **No Auth**: No authentication/authorization layer (out of scope for V1)

## Development Notes

### PayloadHash Calculation

Current implementation (PLACEHOLDER):
```typescript
keccak256(owner + value + deadline)
```

**Production requirements:**
- Include KYC verification hash
- Include risk assessment score
- Include compliance flags
- Include source of funds declaration

### EIP-712 Structure

Current structure is a placeholder and **MUST** match the smart contract:

```typescript
const domain = {
  name: 'Asset Manager AML Declaration',
  version: '1',
  chainId: 1,
};

const types = {
  Declaration: [
    { name: 'owner', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'message', type: 'string' },  // Contains the full AML declaration text
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};
```

## Out of Scope (V1)

- ❌ Smart contract implementation
- ❌ Backend signature verification
- ❌ Admin/operator dashboard
- ❌ Advanced nonce management
- ❌ User authentication
- ❌ Unit/integration tests
- ❌ CI/CD pipeline

## Contributing

This is a V1 implementation. Key areas for improvement:

1. Replace placeholder payloadHash logic
2. Confirm EIP-712 structure with smart contract
3. Implement incremental nonce system
4. Add signature verification (if needed server-side)
5. Add proper authentication/authorization

## License

[Add License Here]
