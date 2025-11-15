/**
 * Amount input component for signing page
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AmountInputProps {
  amount: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function AmountInput({ amount, onChange, disabled }: AmountInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="amount">Amount (USDC)</Label>
      <Input
        id="amount"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter USDC amount (e.g., 100.50)"
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">
        Enter the amount of USDC to transfer (6 decimals)
      </p>
    </div>
  );
}
