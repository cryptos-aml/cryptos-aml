/**
 * AML Declaration text display component
 */

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AML_DECLARATION_TEXT } from "@/lib/constants";

export function AmlDeclarationDisplay() {
  return (
    <div className="space-y-2">
      <Label>AML Declaration</Label>
      <Textarea
        value={AML_DECLARATION_TEXT}
        readOnly
        className="min-h-[120px] font-mono text-xs resize-none"
      />
      <p className="text-xs text-muted-foreground">
        By signing, you agree to this declaration
      </p>
    </div>
  );
}
