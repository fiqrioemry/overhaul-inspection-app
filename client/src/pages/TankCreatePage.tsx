// src/pages/TankCreatePage.tsx
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import TankForm from "@/features/tanks/components/TankForm";
import { useCreateTank } from "@/features/tanks/tanks.query";
import { ROUTES } from "@/constants/route.constant";
import type { CreateTankFormValues } from "@/schemas/tanks.schema";

export default function TankCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateTank();

  function handleSubmit(values: CreateTankFormValues, files: File[]) {
    const payload = {
      ...values,
      diameterMm: values.diameterMm ? Number(values.diameterMm) : undefined,
      heightMm: values.heightMm ? Number(values.heightMm) : undefined,
      capacityM3: values.capacityM3 ? Number(values.capacityM3) : undefined,
      files: files.length > 0 ? files : undefined,
    };
    createMutation.mutate(payload, {
      onSuccess: (tank) => navigate(ROUTES.TANK_DETAIL.replace(":tankId", tank.id)),
    });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Create Tank" description="Register a physical tank asset. Overhaul projects are created separately." />
      <TankForm mode="create" onSubmit={handleSubmit} isPending={createMutation.isPending} />
    </div>
  );
}
