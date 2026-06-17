// src/features/companies/components/CompanyFormDialog.tsx
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShortTextField from "@/components/fields/ShortTextField";
import SelectField from "@/components/fields/SelectField";
import SwitchField from "@/components/fields/SwitchField";
import { createCompanySchema, COMPANY_TYPE_OPTIONS } from "@/schemas/companies.schema";
import type { CreateCompanyFormValues } from "@/schemas/companies.schema";
import { useCreateCompany, useUpdateCompany } from "@/features/companies/companies.query";
import type { Company } from "@/features/companies/companies.api";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
}

const DEFAULT_VALUES: CreateCompanyFormValues = {
  name: "",
  type: "CONTRACTOR",
  address: "",
  phone: "",
  email: "",
  isActive: true,
};

export default function CompanyFormDialog({ open, onOpenChange, company }: CompanyFormDialogProps) {
  const isEdit = Boolean(company);
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema) as Resolver<CreateCompanyFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open && company && isEdit) {
      form.reset({
        name: company.name,
        type: company.type,
        address: company.address ?? "",
        phone: company.phone ?? "",
        email: company.email ?? "",
        isActive: company.isActive,
      });
    } else if (!open) {
      form.reset(DEFAULT_VALUES);
      clearLogo();
    }
  }, [company, open]);

  function clearLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
  }

  function handleDialogChange(nextOpen: boolean) {
    if (!nextOpen) clearLogo();
    onOpenChange(nextOpen);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function onSubmit(values: CreateCompanyFormValues) {
    const payload = {
      ...values,
      address: values.address || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      logo: logoFile ?? undefined,
    };
    if (isEdit && company) {
      updateMutation.mutate({ id: company.id, data: payload }, { onSuccess: () => handleDialogChange(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => handleDialogChange(false) });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const displayLogo = logoPreview ?? company?.logoUrl ?? undefined;

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="xl:h-138 xl:w-110!">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Company" : "Add Company"}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="h-14 w-14 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                {displayLogo ? <img src={displayLogo} alt="Logo" className="h-full w-full object-cover" /> : <span className="text-xs text-muted-foreground">Logo</span>}
              </div>
              <button type="button" onClick={() => logoInputRef.current?.click()} className="absolute -bottom-0.5 -right-0.5 rounded-full bg-primary p-1 text-primary-foreground shadow">
                <Camera className="h-3 w-3" />
              </button>
              <input ref={logoInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleLogoChange} />
            </div>
            <p className="text-xs text-muted-foreground">{logoFile ? logoFile.name : "JPEG or PNG, max 1 MB"}</p>
          </div>

          <ShortTextField control={form.control} name="name" label="Company Name" placeholder="PT. Example" />
          <SelectField control={form.control} name="type" label="Type" options={COMPANY_TYPE_OPTIONS} />
          <ShortTextField control={form.control} name="address" label="Address" placeholder="Optional" />
          <div className="grid grid-cols-2 gap-4">
            <ShortTextField control={form.control} name="phone" label="Phone" placeholder="Optional" />
            <ShortTextField control={form.control} name="email" label="Email" type="email" placeholder="Optional" />
          </div>
          <SwitchField control={form.control} name="isActive" label="Active" description="Company is available for assignment" />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleDialogChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
