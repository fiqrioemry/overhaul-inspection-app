// src/features/findings/components/FindingStatusDialog.tsx
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateFindingStatus } from "../findings.query";
import { FindingStatusBadge } from "./FindingStatusBadge";
import type { FindingSummary, FindingStatus } from "../findings.api";

const ALL_STATUSES: FindingStatus[] = ["OPEN", "IN_REPAIR", "REPAIRED", "VERIFIED", "CLOSED", "REJECTED"];

const STATUS_LABELS: Record<FindingStatus, string> = {
  OPEN: "Open",
  IN_REPAIR: "In Repair",
  REPAIRED: "Repaired",
  VERIFIED: "Verified",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

interface FindingStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finding: FindingSummary;
}

export default function FindingStatusDialog({ open, onOpenChange, finding }: FindingStatusDialogProps) {
  const updateStatus = useUpdateFindingStatus();
  const options = ALL_STATUSES.filter((s) => s !== finding.status);
  const [selectedStatus, setSelectedStatus] = useState<FindingStatus>(options[0]!);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (open) {
      const opts = ALL_STATUSES.filter((s) => s !== finding.status);
      setSelectedStatus(opts[0]!);
      setRemarks("");
    }
  }, [open, finding.status]);

  function handleSubmit() {
    if (!selectedStatus) return;
    updateStatus.mutate(
      { id: finding.id, data: { status: selectedStatus, remarks: remarks || undefined } },
      {
        onSuccess: () => {
          onOpenChange(false);
          setRemarks("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as FindingStatus)}>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
