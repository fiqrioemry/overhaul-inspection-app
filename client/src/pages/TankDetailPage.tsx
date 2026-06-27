// src/pages/TankDetailPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, ClipboardList, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import PermissionGate from "@/components/common/PermissionGate";
import TankProcessList from "@/features/tanks/components/TankProcessList";
import CreateOverhaulProjectDialog from "@/features/tank-projects/components/CreateOverhaulProjectDialog";
import { useTank } from "@/features/tanks/tanks.query";
import type { ShellCourse } from "@/features/tanks/tanks.api";
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

function ShellCoursesTable({ shellCourses }: { shellCourses: ShellCourse[] }) {
  if (shellCourses.length === 0) {
    return <p className="text-sm text-muted-foreground">No shell course data recorded.</p>;
  }
  return (
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
          {shellCourses.map((sc) => (
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
  );
}

export default function TankDetailPage() {
  const { tankId } = useParams<{ tankId: string }>();
  const navigate = useNavigate();
  const { data: tank, isLoading, isError, refetch } = useTank(tankId!);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [shellCoursesOpen, setShellCoursesOpen] = useState(false);

  if (isLoading) return <LoadingState />;
  if (isError || !tank) return <ErrorState message="Failed to load tank." onRetry={() => refetch()} />;

  const editPath = ROUTES.TANK_EDIT.replace(":tankId", tankId!);

  const isUnderOverhaul = tank.assetStatus === "UNDER_OVERHAUL";
  const isDecommissioned = tank.assetStatus === "DECOMMISSIONED";
  const hasActiveProject = Boolean(tank.activeProject) || tank.assetStatus === "UNDER_OVERHAUL";
  const canCreateProject = !isDecommissioned && !hasActiveProject;
  const createBlockedReason = isDecommissioned
    ? "Decommissioned tanks cannot start new projects."
    : hasActiveProject
      ? "This tank already has an active project. Complete or cancel it before creating a new overhaul project."
      : "";

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
            <PermissionGate permission={PERMISSIONS.TANK_PROJECT_CREATE}>
              <Button onClick={() => setProjectDialogOpen(true)} disabled={!canCreateProject} title={createBlockedReason || undefined}>
                <Plus /> Start Overhaul Project
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          {isUnderOverhaul && <TabsTrigger value="processes">Processes</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={tank.assetStatus} />
              {tank.activeProject && (
                <span className="text-xs text-muted-foreground">
                  Active project: <span className="font-mono">{tank.activeProject.projectNo}</span>
                </span>
              )}
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
            <InfoRow label="Overhaul Projects" value={tank._count.projects} />
          </div>

          {!isUnderOverhaul && (
            <div className="mt-4 rounded-lg border">
              <button
                type="button"
                onClick={() => setShellCoursesOpen((v) => !v)}
                aria-expanded={shellCoursesOpen}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/20"
              >
                <span>Shell Courses ({tank.shellCourses.length})</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${shellCoursesOpen ? "rotate-180" : ""}`} />
              </button>
              {shellCoursesOpen && (
                <div className="border-t p-4">
                  <ShellCoursesTable shellCourses={tank.shellCourses} />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          {createBlockedReason && (
            <p className="mb-3 text-xs text-muted-foreground">{createBlockedReason}</p>
          )}
          {tank.projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="This tank has no overhaul/repair project. Start one to generate the workflow."
              icon={ClipboardList}
            />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Project No.</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Start</th>
                    <th className="px-4 py-3 text-left font-medium">Est. Finish</th>
                    <th className="px-4 py-3 text-left font-medium">Contractor</th>
                    <th className="px-4 py-3 text-left font-medium">Processes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tank.projects.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono font-medium">{p.projectNo}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.type.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.startDate ? format(new Date(p.startDate), "dd MMM yyyy") : "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.estimatedFinishDate ? format(new Date(p.estimatedFinishDate), "dd MMM yyyy") : "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.contractorCompany?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.processes.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {isUnderOverhaul && (
          <>
            <TabsContent value="processes" className="mt-4">
              <TankProcessList tankId={tankId!} />
            </TabsContent>

            <TabsContent value="shell-courses" className="mt-4">
              <ShellCoursesTable shellCourses={tank.shellCourses} />
            </TabsContent>
          </>
        )}
      </Tabs>

      <CreateOverhaulProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        tankId={tank.id}
        tankNo={tank.tankNo}
      />
    </div>
  );
}
