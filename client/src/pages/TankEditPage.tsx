// src/pages/TankEditPage.tsx
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import TankForm from "@/features/tanks/components/TankForm";
import { useTank, useUpdateTank } from "@/features/tanks/tanks.query";
import { useCompanies } from "@/features/companies/companies.query";
import { ROUTES } from "@/constants/route.constant";
import type { UpdateTankFormValues } from "@/schemas/tanks.schema";

export default function TankEditPage() {
  const { tankId } = useParams<{ tankId: string }>();
  const navigate = useNavigate();
  const { data: tank, isLoading, isError, refetch } = useTank(tankId!);
  const { data: companiesData } = useCompanies({ limit: 100 });
  const updateMutation = useUpdateTank();

  function handleSubmit(values: UpdateTankFormValues) {
    const payload = {
      ...values,
      diameterMm: values.diameterMm ? Number(values.diameterMm) : undefined,
      heightMm: values.heightMm ? Number(values.heightMm) : undefined,
      contractorCompanyId: values.contractorCompanyId && values.contractorCompanyId !== "NONE" ? values.contractorCompanyId : undefined,
      inspectionCompanyId: values.inspectionCompanyId && values.inspectionCompanyId !== "NONE" ? values.inspectionCompanyId : undefined,
      startDate: values.startDate || undefined,
      estimatedFinishDate: values.estimatedFinishDate || undefined,
    };
    updateMutation.mutate(
      { id: tankId!, data: payload },
      { onSuccess: () => navigate(ROUTES.TANK_DETAIL.replace(":tankId", tankId!)) },
    );
  }

  if (isLoading) return <LoadingState />;
  if (isError || !tank) return <ErrorState message="Failed to load tank." onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title={`Edit Tank — ${tank.tankNo}`} description="Update tank information" />
      <TankForm
        mode="edit"
        tank={tank}
        onSubmit={handleSubmit}
        isPending={updateMutation.isPending}
        companies={companiesData?.items ?? []}
      />
    </div>
  );
}
