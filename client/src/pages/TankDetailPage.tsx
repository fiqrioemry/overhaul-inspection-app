// src/pages/TankDetailPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import StatusBadge from "@/components/common/StatusBadge";
import PermissionGate from "@/components/common/PermissionGate";
import TankProcessList from "@/features/tanks/components/TankProcessList";
import { useTank } from "@/features/tanks/tanks.query";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";
import { TANK_LOCATION_LABEL, TANK_SERVICE_LABEL } from "@/schemas/tanks.schema";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground w-40 shrink-0">{label}</span>
      <span>{value ?? "—"}</span>
    </div>
  );
}

export default function TankDetailPage() {
  const { tankId } = useParams<{ tankId: string }>();
  const navigate = useNavigate();
  const { data: tank, isLoading, isError, refetch } = useTank(tankId!);

  if (isLoading) return <LoadingState />;
  if (isError || !tank) return <ErrorState message="Failed to load tank." onRetry={() => refetch()} />;

  const editPath = ROUTES.TANK_EDIT.replace(":tankId", tankId!);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${tank.tankNo}${tank.tankName ? ` — ${tank.tankName}` : ""}`}
        description="Tank overview and process workflow"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.TANKS)}>
              <ArrowLeft /> Back
            </Button>
            <PermissionGate permission={PERMISSIONS.TANK_UPDATE}>
              <Button variant="outline" onClick={() => navigate(editPath)}>
                <Pencil /> Edit Tank
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
          <TabsTrigger value="shell-courses">Shell Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={tank.status} />
            </div>
            <InfoRow label="Tank No." value={tank.tankNo} />
            <InfoRow label="Tank Name" value={tank.tankName} />
            <InfoRow label="Location" value={tank.location ? TANK_LOCATION_LABEL[tank.location] : null} />
            <InfoRow label="Capacity (m³)" value={tank.capacityM3?.toLocaleString()} />
            <InfoRow label="Service / Product" value={tank.service ? TANK_SERVICE_LABEL[tank.service] : null} />
            <InfoRow label="Diameter (mm)" value={tank.diameterMm?.toLocaleString()} />
            <InfoRow label="Height (mm)" value={tank.heightMm?.toLocaleString()} />
            <InfoRow label="Shell Courses" value={tank.shellCourseCount} />
            <InfoRow label="Steam Coil" value={tank.hasSteamCoil ? "Yes" : "No"} />
            <InfoRow label="Contractor" value={tank.contractorCompany?.name} />
            <InfoRow label="Inspection Co." value={tank.inspectionCompany?.name} />
            <InfoRow
              label="Start Date"
              value={tank.startDate ? format(new Date(tank.startDate), "dd MMM yyyy") : null}
            />
            <InfoRow
              label="Est. Finish Date"
              value={tank.estimatedFinishDate ? format(new Date(tank.estimatedFinishDate), "dd MMM yyyy") : null}
            />
          </div>
        </TabsContent>

        <TabsContent value="processes" className="mt-4">
          <TankProcessList tankId={tankId!} />
        </TabsContent>

        <TabsContent value="shell-courses" className="mt-4">
          {tank.shellCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shell course data recorded.</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Course No.</th>
                    <th className="px-4 py-3 text-left font-medium">Thickness (mm)</th>
                    <th className="px-4 py-3 text-left font-medium">Plate Dimension</th>
                    <th className="px-4 py-3 text-left font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tank.shellCourses.map((sc) => (
                    <tr key={sc.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">{sc.courseNo}</td>
                      <td className="px-4 py-3">{sc.thicknessMm}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sc.plateDimension ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sc.remarks ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
