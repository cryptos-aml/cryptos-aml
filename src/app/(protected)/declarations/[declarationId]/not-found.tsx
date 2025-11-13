import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h2 className="text-2xl font-bold">Declaration Not Found</h2>
      <p className="text-muted-foreground">
        The declaration you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild variant="outline">
        <Link href="/declarations" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Declarations
        </Link>
      </Button>
    </div>
  );
}
