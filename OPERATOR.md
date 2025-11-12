# Operator Guide

This guide is for operators who need to process pending AML declarations and submit them to the blockchain.

## Overview

The operator is responsible for:
1. Fetching pending declarations from the API
2. Submitting them to the smart contract for on-chain verification
3. Updating declaration status (executed/failed) with transaction hash

## Authentication

All operator endpoints require an API token passed in the `Authorization` header:

```bash
Authorization: Bearer YOUR_API_TOKEN
```

### Generate API Token

```bash
# Generate a secure random token
openssl rand -base64 32
```

Add it to your `.env.local`:
```
OPERATOR_API_TOKEN=your_generated_token_here
```

## API Endpoints

### 1. Get Pending Declarations

Fetch pending declarations by querying all declarations for a wallet.

**Endpoint**: `GET /api/declarations/[wallet]`

Filter by `status: "pending"` on the client side.

**Response**:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "owner": "0x4885f2096307d9378ab0c5fe262c90b0e1d492f1",
    "to": "0x0000000000000000000000000000000000000000",
    "value": "1000000000000000000",
    "signature": "0x...",
    "nonce": "PaqCmio4RTr",
    "deadline": 1735689600,
    "payloadHash": "0x...",
    "status": "pending",
    "createdAt": "2025-11-12T17:32:00.000Z"
  }
]
```

### 2. Mark Declaration as Executed

Mark a declaration as executed using its nonce.

**Endpoint**: `POST /api/declarations/mark-executed`

**Headers**:
```
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

**Body**:
```json
{
  "nonce": "PaqCmio4RTr",
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

**Response**:
```json
{
  "success": true,
  "declaration": {
    "id": "507f1f77bcf86cd799439011",
    "nonce": "PaqCmio4RTr",
    "status": "executed",
    "txHash": "0x1234...",
    "executedAt": "2025-11-12T17:35:00.000Z"
  }
}
```

### 3. Mark Declaration as Failed

Mark a declaration as failed using its nonce.

**Endpoint**: `POST /api/declarations/mark-failed`

**Headers**:
```
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

**Body**:
```json
{
  "nonce": "PaqCmio4RTr",
  "txHash": "0x..." // Optional - include if transaction failed on-chain
}
```

**Response**:
```json
{
  "success": true,
  "declaration": {
    "id": "507f1f77bcf86cd799439011",
    "nonce": "PaqCmio4RTr",
    "status": "failed",
    "txHash": null
  }
}
```

## Example Usage

### Using cURL

```bash
# 1. Fetch declarations for a wallet
curl http://localhost:3000/api/declarations/0x4885f2096307d9378ab0c5fe262c90b0e1d492f1

# 2. Mark as executed (using nonce)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nonce":"PaqCmio4RTr","txHash":"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"}' \
  http://localhost:3000/api/declarations/mark-executed

# 3. Mark as failed (using nonce)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nonce":"PaqCmio4RTr"}' \
  http://localhost:3000/api/declarations/mark-failed
```

### Using the Example Script

We provide a template script in `scripts/operator-example.ts`:

```bash
# Set environment variables
export API_URL=http://localhost:3000
export OPERATOR_API_TOKEN=your_token_here

# Run the script
npx tsx scripts/operator-example.ts
```

**Note**: The example script contains placeholder logic. You need to add your smart contract interaction code.

## Smart Contract Integration

The operator needs to:

1. **Verify the signature** (optional - smart contract will do this)
2. **Submit to smart contract** with:
   - `owner`: Wallet address
   - `to`: Vault address
   - `value`: Amount in wei
   - `nonce`: Unique nonce ID
   - `deadline`: Expiration timestamp
   - `signature`: EIP-712 signature

Example with ethers.js:

```typescript
import { ethers } from 'ethers';

// Setup
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// Submit declaration
async function submitDeclaration(declaration) {
  const tx = await contract.verifyAndRecordDeclaration(
    declaration.owner,
    declaration.to,
    declaration.value,
    declaration.nonce,
    declaration.deadline,
    declaration.signature
  );
  
  const receipt = await tx.wait();
  return receipt.hash;
}
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/missing API token | Check `OPERATOR_API_TOKEN` |
| 404 Not Found | Declaration doesn't exist | Verify declaration ID |
| 400 Invalid txHash | Malformed transaction hash | Must be 0x + 64 hex chars |
| 400 Already executed | Declaration already processed | Skip this declaration |

### Retry Logic

Implement retry logic for failed submissions:

```typescript
async function submitWithRetry(declaration, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await submitToSmartContract(declaration);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

## Production Deployment

### Security Checklist

- ✅ Use strong API token (32+ characters, random)
- ✅ Store token in environment variables, not in code
- ✅ Use HTTPS in production
- ✅ Rotate API tokens periodically
- ✅ Monitor operator logs
- ✅ Set up alerts for failures

### Monitoring

Track these metrics:
- Number of pending declarations
- Processing success rate
- Average processing time
- Failed declarations (investigate causes)

### Automation

Run the operator as:

1. **Cron job**:
   ```bash
   */5 * * * * /path/to/operator-script.sh
   ```

2. **Systemd service** (Linux):
   ```bash
   sudo systemctl enable operator.service
   sudo systemctl start operator.service
   ```

3. **PM2** (Node.js):
   ```bash
   pm2 start operator.js --cron "*/5 * * * *"
   ```

## Troubleshooting

### No pending declarations

Check if declarations are being created:
```bash
curl http://localhost:3000/api/declarations/0x4885...92f1
```

### Signature verification fails

Ensure EIP-712 domain/types match between frontend and smart contract.

### Gas issues

Monitor gas prices and adjust:
```typescript
const tx = await contract.verify(..., {
  gasLimit: 200000,
  maxFeePerGas: ethers.parseUnits('50', 'gwei')
});
```

## Support

For issues or questions:
- Check logs in the console
- Review smart contract events
- Verify API token is correct
- Test with a single declaration first

---

**Security Note**: The operator has write access to the database. Protect the API token like a password.
