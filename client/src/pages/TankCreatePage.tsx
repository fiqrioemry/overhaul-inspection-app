// src/pages/TankCreatePage.tsx
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import TankForm from "@/features/tanks/components/TankForm";
import { useCreateTank } from "@/features/tanks/tanks.query";
import { useCompanies } from "@/features/companies/companies.query";
import { ROUTES } from "@/constants/route.constant";
import type { CreateTankFormValues } from "@/schemas/tanks.schema";

export default function TankCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateTank();
  const { data: companiesData } = useCompanies({ limit: 100 });

  function handleSubmit(values: CreateTankFormValues) {
    const payload = {
      ...values,
      diameterMm: values.diameterMm ? Number(values.diameterMm) : undefined,
      heightMm: values.heightMm ? Number(values.heightMm) : undefined,
      contractorCompanyId: values.contractorCompanyId || undefined,
      inspectionCompanyId: values.inspectionCompanyId || undefined,
      startDate: values.startDate || undefined,
      estimatedFinishDate: values.estimatedFinishDate || undefined,
    };
    createMutation.mutate(payload, {
      onSuccess: (tank) => navigate(ROUTES.TANK_DETAIL.replace(":tankId", tank.id)),
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Create Tank" description="Register a new tank for inspection workflow" />
      <TankForm
        mode="create"
        onSubmit={handleSubmit}
        isPending={createMutation.isPending}
        companies={companiesData?.items ?? []}
      />
    </div>
  );
}
