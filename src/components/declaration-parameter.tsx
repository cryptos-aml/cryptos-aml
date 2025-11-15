/**
 * Reusable component to display a contract parameter
 */

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface DeclarationParameterProps {
  label: string;
  type: string;
  value: string;
}

export function DeclarationParameter({
  label,
  type,
  value,
}: DeclarationParameterProps) {
  const copyParam = () => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-1">
          {label} ({type})
        </p>
        <p className="font-mono text-xs break-all">{value}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={copyParam}
        className="shrink-0"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
