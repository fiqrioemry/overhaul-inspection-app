// src/features/findings/components/FindingStatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import type { FindingStatus } from "../findings.api";

const STATUS_CONFIG: Record<FindingStatus, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-red-100 text-red-700 border-red-200" },
  IN_REPAIR: { label: "In Repair", className: "bg-orange-100 text-orange-700 border-orange-200" },
  CLOSE: { label: "Closed", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  MINOR: { label: "Minor", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  MAJOR: { label: "Major", className: "bg-orange-100 text-orange-700 border-orange-200" },
  CRITICAL: { label: "Critical", className: "bg-red-100 text-red-800 border-red-300 font-semibold" },
};

export function FindingStatusBadge({ status }: { status: FindingStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function FindingSeverityBadge({ severity }: { severity: string }) {
  const config = SEVERITY_CONFIG[severity] ?? { label: severity, className: "" };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
