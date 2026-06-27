// src/pages/TankEditPage.tsx
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import TankForm from "@/features/tanks/components/TankForm";
import { useTank, useUpdateTank } from "@/features/tanks/tanks.query";
import { ROUTES } from "@/constants/route.constant";
import type { UpdateTankFormValues } from "@/schemas/tanks.schema";

export default function TankEditPage() {
  const { tankId } = useParams<{ tankId: string }>();
  const navigate = useNavigate();
  const { data: tank, isLoading, isError, refetch } = useTank(tankId!);
  const updateMutation = useUpdateTank();

  function handleSubmit(values: UpdateTankFormValues) {
    const payload = {
      ...values,
      diameterMm: values.diameterMm ? Number(values.diameterMm) : undefined,
      heightMm: values.heightMm ? Number(values.heightMm) : undefined,
      capacityM3: values.capacityM3 ? Number(values.capacityM3) : undefined,
      // Renumber courses to close gaps from removals; drop empty optional text fields.
      shellCourses: values.shellCourses?.map((sc, index) => ({
        courseNo: index + 1,
        thicknessMm: Number(sc.thicknessMm),
        plateDimension: sc.plateDimension?.trim() || undefined,
        remarks: sc.remarks?.trim() || undefined,
      })),
    };
    updateMutation.mutate({ id: tankId!, data: payload }, { onSuccess: () => navigate(ROUTES.TANK_DETAIL.replace(":tankId", tankId!)) });
  }

  if (isLoading) return <LoadingState />;
  if (isError || !tank) return <ErrorState message="Failed to load tank." onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={`Edit Tank — ${tank.tankNo}`}
        description="Update tank asset information"
        action={
          <Button variant="outline" onClick={() => navigate(ROUTES.TANK_DETAIL.replace(":tankId", tankId!))}>
            <ArrowLeft />
            Back
          </Button>
        }
      />
      <TankForm mode="edit" tank={tank} onSubmit={handleSubmit} isPending={updateMutation.isPending} />
    </div>
  );
}
