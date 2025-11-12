'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DeclarationFormProps {
  amount: string;
  vaultAddress: string;
  declarationText: string;
  onAmountChange: (value: string) => void;
  onVaultAddressChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
  success: boolean;
  payloadHash: string;
}

export function DeclarationForm({
  amount,
  vaultAddress,
  declarationText,
  onAmountChange,
  onVaultAddressChange,
  onSubmit,
  loading,
  error,
  success,
  payloadHash,
}: DeclarationFormProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (ETH)</Label>
        <Input
          id="amount"
          type="number"
          step="0.000001"
          min="0"
          placeholder="0.0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="bg-muted/50 border-border"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="vault">Vault Address</Label>
        <Input
          id="vault"
          type="text"
          placeholder="0x..."
          value={vaultAddress}
          onChange={(e) => onVaultAddressChange(e.target.value)}
          className="bg-muted/50 border-border font-mono text-xs opacity-60"
          disabled
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="declaration">AML Declaration</Label>
        <Textarea
          id="declaration"
          readOnly
          value={declarationText}
          className="h-44 bg-muted/50 border-border text-sm resize-none"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>
            ✅ Declaration signed successfully!
            <br />
            <span className="text-xs font-mono">
              Payload Hash: {payloadHash.slice(0, 20)}...
            </span>
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={onSubmit}
        disabled={loading || !amount || !vaultAddress}
        className="w-full"
        size="lg"
      >
        {loading ? 'Signing...' : 'Sign AML Declaration'}
      </Button>
    </div>
  );
}
