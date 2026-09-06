// src/pages/TankDetailPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, ClipboardList, ChevronDown, Ban, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import PermissionGate from "@/components/common/PermissionGate";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TankProcessList from "@/features/tanks/components/TankProcessList";
import CreateOverhaulProjectDialog from "@/features/tank-projects/components/CreateOverhaulProjectDialog";
import EditOverhaulProjectDialog from "@/features/tank-projects/components/EditOverhaulProjectDialog";
import { useTank } from "@/features/tanks/tanks.query";
import { useUpdateTankProject, useDeleteTankProject } from "@/features/tank-projects/tank-projects.query";
import type { ShellCourse, TankProjectSummary } from "@/features/tanks/tanks.api";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";
import { TANK_LOCATION_LABEL, TANK_SERVICE_LABEL } from "@/schemas/tanks.schema";

const CANCELLABLE_PROJECT_STATUSES = ["PLANNED", "IN_PROGRESS", "ON_HOLD"];

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
  const [editingProject, setEditingProject] = useState<TankProjectSummary | null>(null);
  const [cancelTarget, setCancelTarget] = useState<TankProjectSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TankProjectSummary | null>(null);
  const updateMutation = useUpdateTankProject();
  const deleteMutation = useDeleteTankProject();

  if (isLoading) return <LoadingState />;
  if (isError || !tank) return <ErrorState message="Failed to load tank." onRetry={() => refetch()} />;

  const editPath = ROUTES.TANK_EDIT.replace(":tankId", tankId!);

  const isUnderOverhaul = tank.assetStatus === "UNDER_OVERHAUL";
  // The tab follows the processes, not the tank's asset status: a project that completes flips
  // the tank back to OPERATIONAL, and hiding the tab then would remove the only way to reopen a
  // process that was completed by mistake.
  const hasProcesses = tank.projects.some((p) => p.processes.length > 0);
  const isDecommissioned = tank.assetStatus === "DECOMMISSIONED";
  const hasActiveProject = Boolean(tank.activeProject) || tank.assetStatus === "UNDER_OVERHAUL";
  const canCreateProject = !isDecommissioned && !hasActiveProject;
  const createBlockedReason = isDecommissioned ? "Decommissioned tanks cannot start new projects." : hasActiveProject ? "This tank already has an active project. Complete or cancel it before creating a new overhaul project." : "";

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
          {(isUnderOverhaul || hasProcesses) && <TabsTrigger value="processes">Processes</TabsTrigger>}
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

          {tank.shellCourses.length > 0 && (
            <div className="mt-4 rounded-lg border">
              <button type="button" onClick={() => setShellCoursesOpen((v) => !v)} aria-expanded={shellCoursesOpen} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/20">
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
          {createBlockedReason && <p className="mb-3 text-xs text-muted-foreground">{createBlockedReason}</p>}
          {tank.projects.length === 0 ? (
            <EmptyState title="No projects yet" description="This tank has no overhaul/repair project. Start one to generate the workflow." icon={ClipboardList} />
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
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tank.projects.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono font-medium">{p.projectNo}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.type.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.startDate ? format(new Date(p.startDate), "dd MMM yyyy") : "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.estimatedFinishDate ? format(new Date(p.estimatedFinishDate), "dd MMM yyyy") : "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.contractorCompany?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.processes.length}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <PermissionGate permission={PERMISSIONS.TANK_PROJECT_UPDATE}>
                            <Button variant="ghost" size="icon-sm" onClick={() => setEditingProject(p)} title="Edit project">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {CANCELLABLE_PROJECT_STATUSES.includes(p.status) && (
                              <Button variant="ghost" size="icon-sm" onClick={() => setCancelTarget(p)} title="Cancel project">
                                <Ban className="h-3.5 w-3.5 text-amber-600" />
                              </Button>
                            )}
                          </PermissionGate>
                          <PermissionGate permission={PERMISSIONS.TANK_PROJECT_DELETE}>
                            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(p)} title="Delete project">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {(isUnderOverhaul || hasProcesses) && (
          <TabsContent value="processes" className="mt-4">
            {/* projectId stays the *active* project only: "Add Process" is rejected by the
                server for a completed one, so the button correctly disappears with it. */}
            <TankProcessList tankId={tankId!} projectId={tank.activeProject?.id} />
          </TabsContent>
        )}
      </Tabs>

      <CreateOverhaulProjectDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} tankId={tank.id} tankNo={tank.tankNo} />
      <EditOverhaulProjectDialog
        open={Boolean(editingProject)}
        onOpenChange={(next) => {
          if (!next) setEditingProject(null);
        }}
        project={editingProject}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel Project"
        description={`Cancel project "${cancelTarget?.projectNo ?? ""}"? Its status will be set to Cancelled and the tank will be freed up for a new project. This cannot be undone.`}
        confirmLabel="Cancel Project"
        variant="destructive"
        loading={updateMutation.isPending}
        onConfirm={() => {
          if (!cancelTarget) return;
          updateMutation.mutate({ id: cancelTarget.id, data: { status: "CANCELLED" } }, { onSuccess: () => setCancelTarget(null) });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Project"
        description={`Permanently delete project "${deleteTarget?.projectNo ?? ""}"? Use this only to correct a project that should never have been created. This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </div>
  );
}
