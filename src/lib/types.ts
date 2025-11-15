/**
 * TypeScript interfaces for EIP-712 typed data
 */

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract?: string;
}

export interface EIP712TypeProperty {
  name: string;
  type: string;
}

export interface EIP712Types {
  [key: string]: EIP712TypeProperty[];
}

export interface DeclarationMessage {
  owner: string;
  to: string;
  value: string;
  message: string;
  nonce: string;
  deadline: number;
}

/**
 * Request body for creating a new declaration (client-side)
 * Compatible with AMLChainV2 contract format (EIP-712)
 */
export interface CreateDeclarationRequest {
  owner: string;
  to: string;
  value: string;
  signature: string;
  nonce: string;
  deadline?: number; // Optional for V2
}

/**
 * Response for successful declaration creation
 */
export interface CreateDeclarationResponse {
  id: string;
  status: string;
  payloadHash: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  details?: string;
}
