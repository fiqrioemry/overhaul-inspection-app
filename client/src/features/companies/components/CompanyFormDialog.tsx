// src/features/companies/components/CompanyFormDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShortTextField from "@/components/fields/ShortTextField";
import SelectField from "@/components/fields/SelectField";
import { createCompanySchema, COMPANY_ROLE_OPTIONS, COMPANY_STATUS_OPTIONS } from "@/schemas/companies.schema";
import type { CreateCompanyFormValues } from "@/schemas/companies.schema";
import { useCreateCompany, useUpdateCompany } from "@/features/companies/companies.query";
import type { Company } from "@/features/companies/companies.api";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
}

const DEFAULT_VALUES: CreateCompanyFormValues = { name: "", role: "CONTRACTOR", status: "ACTIVE" };

export default function CompanyFormDialog({ open, onOpenChange, company }: CompanyFormDialogProps) {
  const isEdit = Boolean(company);
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();

  const form = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (company && isEdit) {
      form.reset({
        name: company.name,
        role: company.role as CreateCompanyFormValues["role"],
        status: company.status as CreateCompanyFormValues["status"],
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [company, open]);

  function onSubmit(values: CreateCompanyFormValues) {
    if (isEdit && company) {
      updateMutation.mutate({ id: company.id, data: values }, { onSuccess: () => onOpenChange(false) });
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
            <DialogTitle>{isEdit ? "Edit Company" : "Add Company"}</DialogTitle>
          </DialogHeader>
          <ShortTextField control={form.control} name="name" label="Company Name" placeholder="Company name" />
          <SelectField control={form.control} name="role" label="Role" options={COMPANY_ROLE_OPTIONS} />
          <SelectField control={form.control} name="status" label="Status" options={COMPANY_STATUS_OPTIONS} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Company"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
