import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "executed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  return (
    <Badge
      variant="secondary"
      className={`${getStatusColor(status)} ${className}`}
    >
      {status.toUpperCase()}
    </Badge>
  );
}
