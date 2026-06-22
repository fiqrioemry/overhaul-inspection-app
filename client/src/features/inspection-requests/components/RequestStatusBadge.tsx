// src/features/inspection-requests/components/RequestStatusBadge.tsx
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_BADGE_CLASS } from "../inspection-request.constants";
import type { InspectionRequestStatus } from "../inspection-requests.api";

export default function RequestStatusBadge({ status, className }: { status: InspectionRequestStatus; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_BADGE_CLASS[status], className)}>{STATUS_LABELS[status] ?? status}</span>;
}
