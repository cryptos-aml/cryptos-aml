# Guide Postman - API Endpoints

## 🔧 Configuration

### Base URL
```
http://localhost:3000
```

### Variables d'environnement Postman
Créer ces variables dans Postman :
- `base_url` = `http://localhost:3000`
- `operator_token` = Ton token API (voir .env.local)

---

## 📋 Endpoints Publics

### 1. GET `/api/sign-params`
Récupère les paramètres de signature pour une nouvelle déclaration.

**URL**: `{{base_url}}/api/sign-params`  
**Method**: `GET`  
**Auth**: Aucune  

**Response** (200):
```json
{
  "domain": {
    "name": "Asset Manager AML Declaration",
    "version": "1",
    "chainId": 1
  },
  "types": {
    "Declaration": [
      { "name": "owner", "type": "address" },
      { "name": "to", "type": "address" },
      { "name": "value", "type": "uint256" },
      { "name": "message", "type": "string" },
      { "name": "nonce", "type": "string" },
      { "name": "deadline", "type": "uint256" }
    ]
  },
  "message": {
    "owner": "0x0000000000000000000000000000000000000000",
    "to": "0x0000000000000000000000000000000000000000",
    "value": "0",
    "message": "I hereby declare that...",
    "nonce": "PaqCmio4RTr",
    "deadline": 1735689600
  }
}
```

---

### 2. POST `/api/declarations`
Créer une nouvelle déclaration AML.

**URL**: `{{base_url}}/api/declarations`  
**Method**: `POST`  
**Auth**: Aucune  
**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "owner": "0x4885f2096307d9378ab0c5fe262c90b0e1d492f1",
  "value": "1000000000000000000",
  "signature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
  "nonce": "PaqCmio4RTr",
  "deadline": 1735689600
}
```

**Response** (200):
```json
{
  "id": "673396f1b2c8b1f8e4e1a1",
  "status": "pending",
  "payloadHash": "0x0ad03c08ad4b09a4b282c2f3e9d8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0"
}
```

**Notes**:
- `owner`: Adresse Ethereum (0x + 40 hex)
- `value`: Montant en wei (string)
- `signature`: Signature EIP-712 (0x + 130 hex)
- `nonce`: Nonce unique (11 caractères base58)
- `deadline`: Timestamp Unix (secondes)

---

### 3. GET `/api/declarations/[wallet]`
Récupère toutes les déclarations d'un wallet.

**URL**: `{{base_url}}/api/declarations/0x4885f2096307d9378ab0c5fe262c90b0e1d492f1`  
**Method**: `GET`  
**Auth**: Aucune  

**Response** (200):
```json
[
  {
    "_id": "673396f1b2c8b1f8e4e1a1",
    "owner": "0x4885f2096307d9378ab0c5fe262c90b0e1d492f1",
    "to": "0x0000000000000000000000000000000000000000",
    "value": "1000000000000000000",
    "payloadHash": "0x0ad03c08ad4b09a4b282c2f3e9d8f7a6b5c4d3e2",
    "signature": "0x1234567890abcdef...",
    "nonce": "PaqCmio4RTr",
    "deadline": 1735689600,
    "status": "pending",
    "createdAt": "2025-11-12T17:32:00.000Z",
    "executedAt": null,
    "txHash": null
  }
]
```

---

## 🔐 Endpoints Opérateur (Authentifiés)

### Configuration du Token
Ajouter dans les headers de toutes les requêtes opérateur :
```
Authorization: Bearer YOUR_OPERATOR_TOKEN
```

### Générer un Token
```bash
openssl rand -base64 32
```

Puis ajouter dans `.env.local` :
```
OPERATOR_API_TOKEN=ton_token_ici
```

---

### 4. POST `/api/declarations/mark-executed`
Marquer une déclaration comme exécutée (opérateur uniquement).

**URL**: `{{base_url}}/api/declarations/mark-executed`  
**Method**: `POST`  
**Headers**:
```
Authorization: Bearer {{operator_token}}
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "nonce": "PaqCmio4RTr",
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

**Response** (200):
```json
{
  "success": true,
  "declaration": {
    "id": "673396f1b2c8b1f8e4e1a1",
    "nonce": "PaqCmio4RTr",
    "status": "executed",
    "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "executedAt": "2025-11-12T17:35:00.000Z"
  }
}
```

**Erreurs possibles**:
- `401`: Token invalide ou manquant
- `400`: Nonce invalide ou déclaration déjà executed
- `400`: TxHash invalide (doit être 0x + 64 hex)
- `400`: Déclaration expirée
- `404`: Déclaration introuvable

---

### 5. POST `/api/declarations/mark-failed`
Marquer une déclaration comme échouée (opérateur uniquement).

**URL**: `{{base_url}}/api/declarations/mark-failed`  
**Method**: `POST`  
**Headers**:
```
Authorization: Bearer {{operator_token}}
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "nonce": "PaqCmio4RTr",
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

**Notes**:
- `txHash` est **optionnel** pour failed (si la transaction a échoué on-chain)

**Response** (200):
```json
{
  "success": true,
  "declaration": {
    "id": "673396f1b2c8b1f8e4e1a1",
    "nonce": "PaqCmio4RTr",
    "status": "failed",
    "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }
}
```

**Erreurs possibles**:
- `401`: Token invalide ou manquant
- `400`: Nonce invalide
- `400`: Déclaration déjà executed
- `400`: Déclaration expirée
- `404`: Déclaration introuvable

---

## 🧪 Scénarios de Test

### Test 1 : Créer une déclaration complète

1. **GET** `/api/sign-params` → Récupère les params
2. Copier le `nonce` et `deadline` de la réponse
3. **POST** `/api/declarations` avec :
   - `owner`: Ton adresse wallet
   - `value`: "1000000000000000000" (1 ETH)
   - `signature`: Signature fictive (pour test)
   - `nonce`: Le nonce récupéré
   - `deadline`: Le deadline récupéré

### Test 2 : Marquer comme executed

1. **POST** `/api/declarations/mark-executed` avec :
   - Header `Authorization: Bearer YOUR_TOKEN`
   - Body avec le `nonce` de la déclaration
   - TxHash valide (0x + 64 caractères hex)

### Test 3 : Récupérer les déclarations

1. **GET** `/api/declarations/[wallet]`
2. Vérifier que le status est maintenant "executed"

---

## 📝 Collection Postman

### Créer une collection avec ces requêtes :

```
📁 AML Declarations API
├── 📂 Public
│   ├── GET Sign Params
│   ├── POST Create Declaration
│   └── GET Declarations by Wallet
└── 📂 Operator (Auth Required)
    ├── POST Mark Executed
    └── POST Mark Failed
```

### Variables à créer :
- `base_url`: `http://localhost:3000`
- `operator_token`: Ton token depuis `.env.local`
- `test_wallet`: `0x4885f2096307d9378ab0c5fe262c90b0e1d492f1`
- `test_nonce`: (généré dynamiquement après chaque sign-params)

---

## ⚠️ Notes Importantes

### Validation des Formats

**Adresse Ethereum** :
```regex
^0x[a-fA-F0-9]{40}$
```

**Signature** :
```regex
^0x[a-fA-F0-9]{130}$
```

**TxHash** :
```regex
^0x[a-fA-F0-9]{64}$
```

**Nonce** :
- 11 caractères base58
- Caractères valides : `123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`

### Expiration

Les déclarations expirent après 30 jours (deadline).
Les endpoints opérateur rejettent les déclarations expirées avec :
```json
{
  "error": "Declaration has expired. Deadline has passed."
}
```

---

## 🚀 Quick Start

1. Démarrer le serveur :
   ```bash
   pnpm dev
   ```

2. Générer un token opérateur :
   ```bash
   openssl rand -base64 32
   ```

3. Ajouter dans `.env.local` :
   ```
   OPERATOR_API_TOKEN=ton_token_genere
   ```

4. Importer cette collection dans Postman

5. Tester les endpoints dans l'ordre :
   - Sign Params → Create Declaration → Mark Executed

Bonne chance ! 🎯
