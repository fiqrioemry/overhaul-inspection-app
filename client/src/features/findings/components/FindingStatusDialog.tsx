// src/features/findings/components/FindingStatusDialog.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateFindingStatus } from "../findings.query";
import { FindingStatusBadge } from "./FindingStatusBadge";
import type { FindingSummary, FindingStatus } from "../findings.api";

const ALL_STATUSES: FindingStatus[] = ["OPEN", "IN_REPAIR", "CLOSE"];

const STATUS_LABELS: Record<FindingStatus, string> = {
  OPEN: "Open",
  IN_REPAIR: "In Repair",
  CLOSE: "Closed",
};

interface FindingStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finding: FindingSummary;
}

export default function FindingStatusDialog({ open, onOpenChange, finding }: FindingStatusDialogProps) {
  const updateStatus = useUpdateFindingStatus();
  const options = ALL_STATUSES.filter((s) => s !== finding.status);

  // Nullable: null means "no explicit selection yet" — falls back to options[0]
  const [selectedStatus, setSelectedStatus] = useState<FindingStatus | null>(null);
  const [remarks, setRemarks] = useState("");

  // Derive effective selection — reset to first valid option if the stored one is no longer in options
  const effectiveStatus = selectedStatus && options.includes(selectedStatus) ? selectedStatus : options[0]!;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelectedStatus(null);
      setRemarks("");
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    updateStatus.mutate({ id: finding.id, data: { status: effectiveStatus, remarks: remarks || undefined } }, { onSuccess: () => handleOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="xl:h-auto! xl:w-110!">
        <div className="p-4 space-y-4">
          <DialogHeader>
            <DialogTitle>Update Finding Status</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Current:</span>
            <FindingStatusBadge status={finding.status} />
          </div>

          <div className="space-y-1.5">
            <Label>New Status</Label>
            <Select value={effectiveStatus} onValueChange={(v) => setSelectedStatus(v as FindingStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Remarks <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea placeholder="Add notes about this status change..." value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
