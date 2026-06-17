// src/pages/TankCreatePage.tsx
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import TankForm from "@/features/tanks/components/TankForm";
import { useCreateTank } from "@/features/tanks/tanks.query";
import { useCompanyOptions } from "@/features/companies/companies.query";
import { ROUTES } from "@/constants/route.constant";
import type { CreateTankFormValues } from "@/schemas/tanks.schema";

export default function TankCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateTank();
  const { data: contractors = [] } = useCompanyOptions("CONTRACTOR");
  const { data: inspectionCompanies = [] } = useCompanyOptions("INSPECTOR_COMPANY");

  function handleSubmit(values: CreateTankFormValues) {
    const payload = {
      ...values,
      diameterMm: values.diameterMm ? Number(values.diameterMm) : undefined,
      heightMm: values.heightMm ? Number(values.heightMm) : undefined,
      capacityM3: values.capacityM3 ? Number(values.capacityM3) : undefined,
      contractorCompanyId: values.contractorCompanyId && values.contractorCompanyId !== "NONE" ? values.contractorCompanyId : undefined,
      inspectionCompanyId: values.inspectionCompanyId && values.inspectionCompanyId !== "NONE" ? values.inspectionCompanyId : undefined,
      startDate: values.startDate || undefined,
      estimatedFinishDate: values.estimatedFinishDate || undefined,
    };
    createMutation.mutate(payload, {
      onSuccess: (tank) => navigate(ROUTES.TANK_DETAIL.replace(":tankId", tank.id)),
    });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Create Tank" description="Register a new tank for inspection workflow" />
      <TankForm mode="create" onSubmit={handleSubmit} isPending={createMutation.isPending} contractors={contractors} inspectionCompanies={inspectionCompanies} />
    </div>
  );
}
