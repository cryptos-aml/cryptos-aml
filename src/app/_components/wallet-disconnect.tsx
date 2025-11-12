'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalletDisconnectProps {
  onDisconnect: () => void;
}

export function WalletDisconnect({ onDisconnect }: WalletDisconnectProps) {
  return (
    <Button variant="outline" size="icon" onClick={onDisconnect}>
      <LogOut className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Disconnect wallet</span>
    </Button>
  );
}
