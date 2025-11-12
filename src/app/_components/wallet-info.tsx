'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface WalletInfoProps {
  address: string;
}

export function WalletInfo({ address }: WalletInfoProps) {
  return (
    <Card className="bg-muted/50 border-border">
      <CardContent className="pt-4 pb-4">
        <Label className="text-muted-foreground text-sm">Connected Wallet</Label>
        <p className="font-mono text-foreground text-base mt-1 break-all">
          {address}
        </p>
      </CardContent>
    </Card>
  );
}
