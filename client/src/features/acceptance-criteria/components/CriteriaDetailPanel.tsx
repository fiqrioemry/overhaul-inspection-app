// src/features/acceptance-criteria/components/CriteriaDetailPanel.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import LoadingState from "@/components/common/LoadingState";
import { useAddCriteriaReference, useDeleteCriteriaReference, useCriteriaReferences } from "@/features/acceptance-criteria/acceptance-criteria.query";
import { useAllReferenceDocuments } from "@/features/reference-documents/reference-documents.query";
import { addCriteriaReferenceSchema } from "@/schemas/acceptance-criteria.schema";
import type { AddCriteriaReferenceFormValues } from "@/schemas/acceptance-criteria.schema";
import type { AcceptanceCriteria, CriteriaReference } from "@/features/acceptance-criteria/acceptance-criteria.api";
import SelectField from "@/components/fields/SelectField";
import ShortTextField from "@/components/fields/ShortTextField";

interface CriteriaDetailPanelProps {
  criteria: AcceptanceCriteria;
}

export default function CriteriaDetailPanel({ criteria }: CriteriaDetailPanelProps) {
  const [deleteRef, setDeleteRef] = useState<CriteriaReference | undefined>();
  const [showAddRef, setShowAddRef] = useState(false);

  const { data: refs, isLoading: refsLoading } = useCriteriaReferences(criteria.id);
  const addRefMutation = useAddCriteriaReference();
  const deleteRefMutation = useDeleteCriteriaReference();
  const { data: allDocs } = useAllReferenceDocuments();

  const refOptions = allDocs?.map((d) => ({ label: `${d.code} — ${d.title}`, value: d.id })) ?? [];

  const form = useForm<AddCriteriaReferenceFormValues>({
    resolver: zodResolver(addCriteriaReferenceSchema),
    defaultValues: { referenceDocumentId: "", clause: "" },
  });

  function onAddReference(values: AddCriteriaReferenceFormValues) {
    addRefMutation.mutate(
      { criteriaId: criteria.id, data: values },
      {
        onSuccess: () => {
          form.reset();
          setShowAddRef(false);
        },
      },
    );
  }

  function handleDeleteRef() {
    if (!deleteRef) return;
    deleteRefMutation.mutate({ criteriaId: criteria.id, refId: deleteRef.id }, {
      onSuccess: () => setDeleteRef(undefined),
    });
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Code</p>
          <p className="font-mono font-medium">{criteria.code}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Status</p>
          <StatusBadge status={criteria.status} />
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Acceptance Type</p>
          <p>{criteria.acceptanceType}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Required</p>
          <p>{criteria.isRequired ? "Yes" : "No"}</p>
        </div>
        {criteria.method && (
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Method</p>
            <p>{criteria.method}</p>
          </div>
        )}
        {criteria.tools && (
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Tools</p>
            <p>{criteria.tools}</p>
          </div>
        )}
        {criteria.minValue !== null && (
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Min Value</p>
            <p>{criteria.minValue} {criteria.unit}</p>
          </div>
        )}
        {criteria.maxValue !== null && (
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Max Value</p>
            <p>{criteria.maxValue} {criteria.unit}</p>
          </div>
        )}
        {criteria.acceptanceText && (
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Acceptance Text</p>
            <p>{criteria.acceptanceText}</p>
          </div>
        )}
        {criteria.description && (
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Description</p>
            <p className="text-muted-foreground">{criteria.description}</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Reference Documents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <h3 className="font-medium">Reference Documents / Acuan</h3>
            {!refsLoading && <span className="text-xs text-muted-foreground">({refs?.length ?? 0})</span>}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAddRef(!showAddRef)}>
            <Plus />
            Add Reference
          </Button>
        </div>

        {showAddRef && (
          <form onSubmit={form.handleSubmit(onAddReference)} className="rounded-lg border p-4 space-y-3 bg-muted/20">
            <SelectField control={form.control} name="referenceDocumentId" label="Reference Document" options={refOptions} placeholder="Select document..." />
            <ShortTextField control={form.control} name="clause" label="Clause" placeholder="e.g. 4.1.2 (optional)" />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAddRef(false); form.reset(); }}>Cancel</Button>
              <Button type="submit" size="sm" disabled={addRefMutation.isPending}>
                {addRefMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
        )}

        {refsLoading ? (
          <LoadingState />
        ) : (refs?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground italic">No reference documents linked. Every criteria should have at least one reference.</p>
        ) : (
          <div className="space-y-2">
            {refs?.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <span className="font-mono font-medium">{ref.referenceDocument.code}</span>
                  <span className="text-muted-foreground ml-2">— {ref.referenceDocument.title}</span>
                  {ref.clause && <span className="ml-2 text-xs text-muted-foreground">Cl. {ref.clause}</span>}
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteRef(ref)}>
                  <Trash2 className="text-destructive size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteRef)}
        onOpenChange={(open) => { if (!open) setDeleteRef(undefined); }}
        title="Remove Reference"
        description={`Remove reference to "${deleteRef?.referenceDocument.title}"?`}
        confirmLabel="Remove"
        variant="destructive"
        loading={deleteRefMutation.isPending}
        onConfirm={handleDeleteRef}
      />
    </div>
  );
}
