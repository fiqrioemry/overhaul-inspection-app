// src/features/radiography/components/JointResultsTable.tsx
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import ShortTextField from "@/components/fields/ShortTextField";
import SelectField from "@/components/fields/SelectField";
import LongTextField from "@/components/fields/LongTextField";
import EmptyState from "@/components/common/EmptyState";
import PermissionGate from "@/components/common/PermissionGate";
import { useJointResults, useAddJointResult, useDeleteJointResult } from "../radiography.query";
import { PERMISSIONS } from "@/constants/permission.constant";
import type { RadiographyJointResult } from "../radiography.api";

const JOINT_RESULT_COLORS: Record<RadiographyJointResult, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  ACCEPTED: "bg-green-100 text-green-700",
  REPAIR: "bg-orange-100 text-orange-700",
  RESHOOT: "bg-red-100 text-red-700",
};

const JOINT_RESULT_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Repair", value: "REPAIR" },
  { label: "Reshoot", value: "RESHOOT" },
];

const schema = z.object({
  jointNo: z.string().min(1, "Joint No. required"),
  location: z.string().optional(),
  weldType: z.string().optional(),
  welderNo: z.string().optional(),
  filmNo: z.string().optional(),
  result: z.enum(["PENDING", "ACCEPTED", "REPAIR", "RESHOOT"]).default("PENDING"),
  defectType: z.string().optional(),
  repairStatus: z.string().optional(),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface JointResultsTableProps {
  radiographyTestId: string;
  tankProcessId: string;
}

export default function JointResultsTable({ radiographyTestId, tankProcessId }: JointResultsTableProps) {
  const [addOpen, setAddOpen] = useState(false);
  const { data: joints = [], isLoading } = useJointResults(radiographyTestId);
  const addMutation = useAddJointResult(radiographyTestId, tankProcessId);
  const deleteMutation = useDeleteJointResult(radiographyTestId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { jointNo: "", location: "", weldType: "", welderNo: "", filmNo: "", result: "PENDING", defectType: "", repairStatus: "", remarks: "" },
  });

  function handleAdd(values: FormValues) {
    addMutation.mutate(
      {
        jointNo: values.jointNo,
        location: values.location || undefined,
        weldType: values.weldType || undefined,
        welderNo: values.welderNo || undefined,
        filmNo: values.filmNo || undefined,
        result: values.result as RadiographyJointResult,
        defectType: values.defectType || undefined,
        repairStatus: values.repairStatus || undefined,
        remarks: values.remarks || undefined,
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          form.reset();
        },
      },
    );
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading joints...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{joints.length} joint(s)</span>
        <PermissionGate permission={PERMISSIONS.RADIOGRAPHY_UPDATE}>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Joint
          </Button>
        </PermissionGate>
      </div>

      {joints.length === 0 ? (
        <EmptyState title="No joint results" description="Add joint results to record radiography findings." />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Joint No.</th>
                <th className="px-3 py-2 text-left font-medium">Location</th>
                <th className="px-3 py-2 text-left font-medium">Welder No.</th>
                <th className="px-3 py-2 text-left font-medium">Film No.</th>
                <th className="px-3 py-2 text-left font-medium">Result</th>
                <th className="px-3 py-2 text-left font-medium">Defect</th>
                <th className="px-3 py-2 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {joints.map((joint) => (
                <tr key={joint.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono font-medium">{joint.jointNo}</td>
                  <td className="px-3 py-2 text-muted-foreground">{joint.location ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{joint.welderNo ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{joint.filmNo ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className={JOINT_RESULT_COLORS[joint.result]}>
                      {joint.result}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{joint.defectType ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <PermissionGate permission={PERMISSIONS.RADIOGRAPHY_UPDATE}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteMutation.mutate(joint.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="xl:h-auto! xl:w-120!">
          <div className="p-4">
            <DialogHeader>
              <DialogTitle>Add Joint Result</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleAdd)} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ShortTextField control={form.control} name="jointNo" label="Joint No." placeholder="e.g. J-001" />
                <ShortTextField control={form.control} name="location" label="Location" placeholder="e.g. Shell 1-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ShortTextField control={form.control} name="welderNo" label="Welder No." />
                <ShortTextField control={form.control} name="filmNo" label="Film No." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SelectField control={form.control} name="result" label="Result" options={JOINT_RESULT_OPTIONS} />
                <ShortTextField control={form.control} name="defectType" label="Defect Type" placeholder="e.g. Porosity" />
              </div>
              <ShortTextField control={form.control} name="repairStatus" label="Repair Status" placeholder="e.g. Repaired" />
              <LongTextField control={form.control} name="remarks" label="Remarks" rows={2} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Saving..." : "Add Joint"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
