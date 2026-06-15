// src/features/reference-documents/components/ReferenceDocumentFormDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShortTextField from "@/components/fields/ShortTextField";
import SelectField from "@/components/fields/SelectField";
import {
  createReferenceDocumentSchema,
  DOCUMENT_TYPE_OPTIONS,
  REFERENCE_DOCUMENT_STATUS_OPTIONS,
} from "@/schemas/reference-documents.schema";
import type { CreateReferenceDocumentFormValues } from "@/schemas/reference-documents.schema";
import { useCreateReferenceDocument, useUpdateReferenceDocument } from "@/features/reference-documents/reference-documents.query";
import type { ReferenceDocument } from "@/features/reference-documents/reference-documents.api";

interface ReferenceDocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: ReferenceDocument;
}

const DEFAULT_VALUES: CreateReferenceDocumentFormValues = {
  code: "",
  title: "",
  documentType: "STANDARD",
  revision: "",
  issuer: "",
  status: "ACTIVE",
};

export default function ReferenceDocumentFormDialog({ open, onOpenChange, document }: ReferenceDocumentFormDialogProps) {
  const isEdit = Boolean(document);
  const createMutation = useCreateReferenceDocument();
  const updateMutation = useUpdateReferenceDocument();

  const form = useForm<CreateReferenceDocumentFormValues>({
    resolver: zodResolver(createReferenceDocumentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (document && isEdit) {
      form.reset({
        code: document.code,
        title: document.title,
        documentType: document.documentType as CreateReferenceDocumentFormValues["documentType"],
        revision: document.revision ?? "",
        issuer: document.issuer ?? "",
        status: document.status as CreateReferenceDocumentFormValues["status"],
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [document, open]);

  function onSubmit(values: CreateReferenceDocumentFormValues) {
    if (isEdit && document) {
      updateMutation.mutate({ id: document.id, data: values }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(values, { onSuccess: () => onOpenChange(false) });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-6">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Reference Document" : "Add Reference Document"}</DialogTitle>
          </DialogHeader>
          <ShortTextField control={form.control} name="code" label="Code" placeholder="e.g. ISO-9001" />
          <ShortTextField control={form.control} name="title" label="Title" placeholder="Document title" />
          <SelectField control={form.control} name="documentType" label="Document Type" options={DOCUMENT_TYPE_OPTIONS} />
          <ShortTextField control={form.control} name="revision" label="Revision" placeholder="e.g. Rev 2" />
          <ShortTextField control={form.control} name="issuer" label="Issuer" placeholder="Issuing organization" />
          <SelectField control={form.control} name="status" label="Status" options={REFERENCE_DOCUMENT_STATUS_OPTIONS} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Document"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
