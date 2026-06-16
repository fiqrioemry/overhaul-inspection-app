// src/pages/TankProcessDetailPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Plus, AlertTriangle, Pencil, ArrowRightLeft, Trash2, CheckCheck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ProcessStatusBadge from "@/components/common/ProcessStatusBadge";
import PermissionGate from "@/components/common/PermissionGate";
import ChecklistTable from "@/features/checklist-results/components/ChecklistTable";
import { useChecklistResults } from "@/features/checklist-results/checklist-results.query";
import EligibilityPanel from "@/features/tank-processes/components/EligibilityPanel";
import InspectionRequestForm from "@/features/inspection-requests/components/InspectionRequestForm";
import FindingFormDialog from "@/features/findings/components/FindingFormDialog";
import FindingEditDialog from "@/features/findings/components/FindingEditDialog";
import FindingStatusDialog from "@/features/findings/components/FindingStatusDialog";
import { FindingStatusBadge, FindingSeverityBadge } from "@/features/findings/components/FindingStatusBadge";
import DailyReportFormDialog, { ACTIVITY_LABEL } from "@/features/daily-reports/components/DailyReportFormDialog";
import TestRecordFormDialog from "@/features/test-records/components/TestRecordFormDialog";
import RadiographyFormDialog from "@/features/radiography/components/RadiographyFormDialog";
import JointResultsTable from "@/features/radiography/components/JointResultsTable";
import { useTankProcess, useUpdateProcessStatus } from "@/features/tank-processes/tank-processes.query";
import { useFindings, useDeleteFinding, useBulkCloseFindings } from "@/features/findings/findings.query";
import { useDailyReports, useDeleteDailyReport } from "@/features/daily-reports/daily-reports.query";
import type { DailyReportSummary } from "@/features/daily-reports/daily-reports.api";
import { useTestRecords, useDeleteTestRecord } from "@/features/test-records/test-records.query";
import { useRadiographyTests, useDeleteRadiography } from "@/features/radiography/radiography.query";
import { PERMISSIONS } from "@/constants/permission.constant";
import type { FindingSummary } from "@/features/findings/findings.api";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";
import type { ProcessStatus } from "@/features/tank-processes/tank-processes.api";
import type { TestResult } from "@/features/test-records/test-records.api";

const NEXT_STATUS: Partial<Record<ProcessStatus, ProcessStatus>> = {
  NOT_STARTED: "IN_PROGRESS",
  IN_PROGRESS: "WAITING_REVIEW",
  WAITING_REVIEW: "REVIEWED",
  REVIEWED: "COMPLETED",
};

const STATUS_ACTION_LABEL: Partial<Record<ProcessStatus, string>> = {
  NOT_STARTED: "Start Process",
  IN_PROGRESS: "Submit for Review",
  WAITING_REVIEW: "Mark as Reviewed",
  REVIEWED: "Complete Process",
};

const STATUS_ACTION_PERMISSION: Partial<Record<ProcessStatus, string>> = {
  NOT_STARTED: PERMISSIONS.PROCESS_UPDATE,
  IN_PROGRESS: PERMISSIONS.PROCESS_UPDATE,
  WAITING_REVIEW: PERMISSIONS.INSPECTION_REQUEST_REVIEW,
  REVIEWED: PERMISSIONS.PROCESS_UPDATE,
};

const TEST_RESULT_COLOR: Record<TestResult, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  PASSED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  NOT_APPLICABLE: "bg-muted text-muted-foreground",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground w-44 shrink-0">{label}</span>
      <span>{value ?? "—"}</span>
    </div>
  );
}

export default function TankProcessDetailPage() {
  const { tankId, processId } = useParams<{ tankId: string; processId: string }>();
  const navigate = useNavigate();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [findingDialogOpen, setFindingDialogOpen] = useState(false);
  const [editFinding, setEditFinding] = useState<FindingSummary | null>(null);
  const [statusFinding, setStatusFinding] = useState<FindingSummary | null>(null);
  const [quickCloseFinding, setQuickCloseFinding] = useState<FindingSummary | null>(null);
  const [bulkCloseFindingOpen, setBulkCloseFindingOpen] = useState(false);
  const [selectedFindingIds, setSelectedFindingIds] = useState<Set<string>>(new Set());
  const [deleteFindingTarget, setDeleteFindingTarget] = useState<FindingSummary | null>(null);
  const [dailyReportDialogOpen, setDailyReportDialogOpen] = useState(false);
  const [editDailyReport, setEditDailyReport] = useState<DailyReportSummary | null>(null);
  const [deleteDailyReportTarget, setDeleteDailyReportTarget] = useState<DailyReportSummary | null>(null);
  const [testRecordDialogOpen, setTestRecordDialogOpen] = useState(false);
  const [radiographyDialogOpen, setRadiographyDialogOpen] = useState(false);
  const [expandedRadiographyId, setExpandedRadiographyId] = useState<string | null>(null);

  const { data: process, isLoading, isError, refetch } = useTankProcess(processId!);
  const updateStatus = useUpdateProcessStatus();

  const { data: findingsData } = useFindings({ tankProcessId: processId!, limit: 50, page: 1 });
  const { data: checklistResults = [] } = useChecklistResults(processId!);
  const deleteFinding = useDeleteFinding();
  const bulkClose = useBulkCloseFindings();

  const findingList = findingsData?.items ?? [];
  const closeableFindingIds = findingList.filter((f) => f.status !== "CLOSE").map((f) => f.id);
  const allCloseableSelected = closeableFindingIds.length > 0 && closeableFindingIds.every((id) => selectedFindingIds.has(id));

  function toggleFindingSelectAll() {
    if (allCloseableSelected) {
      setSelectedFindingIds(new Set());
    } else {
      setSelectedFindingIds(new Set(closeableFindingIds));
    }
  }

  function toggleFindingSelect(id: string) {
    setSelectedFindingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }
  const { data: dailyReportsData } = useDailyReports({ tankProcessId: processId!, limit: 50, page: 1 });
  const deleteDailyReport = useDeleteDailyReport();
  const { data: testRecords = [] } = useTestRecords(processId!);
  const { data: radiographyTests = [] } = useRadiographyTests(processId!);

  const deleteTestRecord = useDeleteTestRecord(processId!);
  const deleteRadiography = useDeleteRadiography(processId!);

  if (isLoading) return <LoadingState />;
  if (isError || !process) return <ErrorState message="Failed to load process." onRetry={() => refetch()} />;

  const tankPath = ROUTES.TANK_DETAIL.replace(":tankId", tankId!);
  const nextStatus = NEXT_STATUS[process.status];
  const actionLabel = STATUS_ACTION_LABEL[process.status];
  const actionPermission = STATUS_ACTION_PERMISSION[process.status] ?? PERMISSIONS.PROCESS_UPDATE;
  const isTestType = ["TEST", "NDT"].includes(process.type);

  const FINDING_BLOCKED_STATUSES: ProcessStatus[] = ["NOT_STARTED", "COMPLETED", "REVIEWED"];
  const canAddFinding = !FINDING_BLOCKED_STATUSES.includes(process.status);
  const DAILY_REPORT_BLOCKED_STATUSES: ProcessStatus[] = ["NOT_STARTED", "COMPLETED"];
  const canAddDailyReport = !DAILY_REPORT_BLOCKED_STATUSES.includes(process.status);
  const hasOpenFindings = (findingsData?.items ?? []).some((f) => f.status === "OPEN");
  const hasUncheckedRequired = checklistResults.some((c) => c.status === "NOT_CHECKED" && c.isRequired);
  const submitForReviewBlocked = nextStatus === "WAITING_REVIEW" && (hasOpenFindings || hasUncheckedRequired);

  function handleStatusAdvance() {
    if (!nextStatus) return;
    updateStatus.mutate({ id: processId!, data: { status: nextStatus } });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(tankPath)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tank
        </Button>
      </div>

      <PageHeader
        title={process.name}
        description={`${process.processTemplate.code} · ${process.type}`}
        action={
          <div className="flex items-center gap-2">
            {nextStatus && actionLabel && (
              <PermissionGate permission={actionPermission}>
                <Button
                  variant="outline"
                  onClick={handleStatusAdvance}
                  disabled={updateStatus.isPending || submitForReviewBlocked}
                  title={submitForReviewBlocked ? "Close all OPEN findings before submitting for review" : undefined}
                >
                  {updateStatus.isPending ? "Saving..." : actionLabel}
                </Button>
              </PermissionGate>
            )}
            {process.status === "IN_PROGRESS" && (
              <PermissionGate permission={PERMISSIONS.INSPECTION_REQUEST_CREATE}>
                <Button onClick={() => setRequestDialogOpen(true)}>
                  <Send className="h-4 w-4 mr-1" /> Submit Inspection Request
                </Button>
              </PermissionGate>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <ProcessStatusBadge status={process.status} />
      </div>

      {submitForReviewBlocked && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Cannot submit for review:
            {hasUncheckedRequired && " required checklist items are not yet passed"}
            {hasUncheckedRequired && hasOpenFindings && ", and"}
            {hasOpenFindings && " there are OPEN findings that must be resolved"}
            .
          </span>
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="findings">Findings {findingsData?.meta?.total ? <span className="ml-1 text-xs">({findingsData.meta.total})</span> : null}</TabsTrigger>
          <TabsTrigger value="daily-activity">Daily Activity {dailyReportsData?.meta?.total ? <span className="ml-1 text-xs">({dailyReportsData.meta.total})</span> : null}</TabsTrigger>
          {isTestType && <TabsTrigger value="test-records">Test Records {testRecords.length > 0 ? <span className="ml-1 text-xs">({testRecords.length})</span> : null}</TabsTrigger>}
          {isTestType && <TabsTrigger value="radiography">Radiography {radiographyTests.length > 0 ? <span className="ml-1 text-xs">({radiographyTests.length})</span> : null}</TabsTrigger>}
          <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
          <TabsTrigger value="inspection">Inspection Requests</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4">
          <div className="rounded-lg border p-4 space-y-3">
            <InfoRow label="Process Code" value={<span className="font-mono">{process.processTemplate.code}</span>} />
            <InfoRow label="Process Name" value={process.name} />
            <InfoRow label="Type" value={process.type} />
            <InfoRow label="Sequence" value={process.sequenceOrder} />
            <InfoRow label="Optional" value={process.processTemplate.isOptional ? "Yes" : "No"} />
            <InfoRow label="Status" value={<ProcessStatusBadge status={process.status} />} />
            <InfoRow label="Started At" value={process.startDate ? format(new Date(process.startDate), "dd MMM yyyy HH:mm") : null} />
            <InfoRow label="Completed At" value={process.finishDate ? format(new Date(process.finishDate), "dd MMM yyyy HH:mm") : null} />
            {process.remarks && <InfoRow label="Remarks" value={process.remarks} />}
          </div>
        </TabsContent>

        {/* CHECKLIST */}
        <TabsContent value="checklist" className="mt-4">
          <ChecklistTable processId={processId!} processStatus={process.status} />
        </TabsContent>

        {/* FINDINGS */}
        <TabsContent value="findings" className="mt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{findingsData?.meta?.total ?? 0} finding(s)</span>
                {selectedFindingIds.size > 0 && (
                  <PermissionGate permission={PERMISSIONS.FINDING_UPDATE}>
                    <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => setBulkCloseFindingOpen(true)}>
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      Close Selected ({selectedFindingIds.size})
                    </Button>
                  </PermissionGate>
                )}
              </div>
              {canAddFinding && (
                <PermissionGate permission={PERMISSIONS.FINDING_CREATE}>
                  <Button size="sm" variant="outline" onClick={() => setFindingDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Finding
                  </Button>
                </PermissionGate>
              )}
            </div>

            {!findingList.length ? (
              <EmptyState title="No findings" description="No findings recorded for this process." icon={AlertTriangle} />
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <Checkbox checked={allCloseableSelected} onCheckedChange={toggleFindingSelectAll} aria-label="Select all" disabled={closeableFindingIds.length === 0} />
                      </th>
                      <th className="px-4 py-3 text-left font-medium">No.</th>
                      <th className="px-4 py-3 text-left font-medium">Title</th>
                      <th className="px-4 py-3 text-left font-medium">Severity</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">By</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {findingList.map((f) => {
                      const isTerminal = f.status === "CLOSE";
                      const isSelected = selectedFindingIds.has(f.id);
                      return (
                        <tr key={f.id} className={`hover:bg-muted/20 ${isSelected ? "bg-muted/30" : ""}`}>
                          <td className="px-4 py-3">{!isTerminal && <Checkbox checked={isSelected} onCheckedChange={() => toggleFindingSelect(f.id)} aria-label={`Select ${f.findingNo}`} />}</td>
                          <td className="px-4 py-3 font-mono text-xs">{f.findingNo}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm line-clamp-2">{f.title}</p>
                            {f.locationDetail && <p className="text-xs text-muted-foreground">{f.locationDetail}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <FindingSeverityBadge severity={f.severity} />
                          </td>
                          <td className="px-4 py-3">
                            <FindingStatusBadge status={f.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{f.createdByUser?.name}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(f.createdAt), "dd MMM yyyy")}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <PermissionGate permission={PERMISSIONS.FINDING_UPDATE}>
                                {!isTerminal && (
                                  <>
                                    <Button variant="ghost" size="icon-sm" onClick={() => setEditFinding(f)} title="Edit">
                                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon-sm" onClick={() => setQuickCloseFinding(f)} title="Quick close" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                      <CheckCheck className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                                <Button variant="ghost" size="icon-sm" onClick={() => setStatusFinding(f)} title="Update status">
                                  <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                                {isTerminal && (
                                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleteFindingTarget(f)} title="Delete" disabled={deleteFinding.isPending}>
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                )}
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* DAILY ACTIVITY */}
        <TabsContent value="daily-activity" className="mt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{dailyReportsData?.meta?.total ?? 0} report(s)</span>
              {canAddDailyReport && (
                <PermissionGate permission={PERMISSIONS.DAILY_REPORT_CREATE}>
                  <Button size="sm" variant="outline" onClick={() => setDailyReportDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Report
                  </Button>
                </PermissionGate>
              )}
            </div>

            {!dailyReportsData?.items?.length ? (
              <EmptyState title="No daily reports" description="No daily activity recorded for this process." />
            ) : (
              <div className="space-y-3">
                {dailyReportsData.items.map((report) => (
                  <div key={report.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">{format(new Date(report.reportDate), "dd MMM yyyy")}</span>
                        <Badge variant="outline" className="text-xs">
                          {ACTIVITY_LABEL[report.activityType] ?? report.activityType.replace(/_/g, " ")}
                        </Badge>
                        {report.inspector && <span className="text-xs text-muted-foreground">{report.inspector.name}</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => navigate(ROUTES.DAILY_REPORT_DETAIL.replace(":id", report.id))}
                          title="View Detail"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <PermissionGate permission={PERMISSIONS.DAILY_REPORT_UPDATE}>
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditDailyReport(report)} title="Edit">
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteDailyReportTarget(report)} title="Delete" disabled={deleteDailyReport.isPending}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{report.description ?? "—"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TEST RECORDS */}
        {isTestType && (
          <TabsContent value="test-records" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{testRecords.length} record(s)</span>
                <PermissionGate permission={PERMISSIONS.TEST_RECORD_CREATE}>
                  <Button size="sm" variant="outline" onClick={() => setTestRecordDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Test Record
                  </Button>
                </PermissionGate>
              </div>

              {testRecords.length === 0 ? (
                <EmptyState title="No test records" description="Add test records to document the testing results." />
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Test Date</th>
                        <th className="px-4 py-3 text-left font-medium">Pressure</th>
                        <th className="px-4 py-3 text-left font-medium">Medium</th>
                        <th className="px-4 py-3 text-left font-medium">Holding Time</th>
                        <th className="px-4 py-3 text-left font-medium">Leak</th>
                        <th className="px-4 py-3 text-left font-medium">Result</th>
                        <th className="px-4 py-3 text-right font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {testRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3 text-xs">{rec.testDate ? format(new Date(rec.testDate), "dd MMM yyyy") : "—"}</td>
                          <td className="px-4 py-3 text-xs">{rec.testPressure != null ? `${rec.testPressure} ${rec.pressureUnit ?? ""}` : "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{rec.testMedium ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{rec.holdingTime ?? "—"}</td>
                          <td className="px-4 py-3 text-xs">{rec.leakIndication != null ? (rec.leakIndication ? "Yes" : "No") : "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={TEST_RESULT_COLOR[rec.result]}>
                              {rec.result}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <PermissionGate permission={PERMISSIONS.TEST_RECORD_UPDATE}>
                              <Button variant="ghost" size="icon-sm" onClick={() => deleteTestRecord.mutate(rec.id)} disabled={deleteTestRecord.isPending}>
                                <span className="text-destructive text-xs">Del</span>
                              </Button>
                            </PermissionGate>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* RADIOGRAPHY */}
        {isTestType && (
          <TabsContent value="radiography" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{radiographyTests.length} test(s)</span>
                <PermissionGate permission={PERMISSIONS.RADIOGRAPHY_CREATE}>
                  <Button size="sm" variant="outline" onClick={() => setRadiographyDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> New Radiography Test
                  </Button>
                </PermissionGate>
              </div>

              {radiographyTests.length === 0 ? (
                <EmptyState title="No radiography tests" description="Add a radiography test to record RT results." />
              ) : (
                <div className="space-y-4">
                  {radiographyTests.map((rt) => (
                    <div key={rt.id} className="rounded-lg border">
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20" onClick={() => setExpandedRadiographyId(expandedRadiographyId === rt.id ? null : rt.id)}>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-medium">{rt.area ?? "Radiography Test"}</p>
                            <p className="text-xs text-muted-foreground">
                              {rt.testDate ? format(new Date(rt.testDate), "dd MMM yyyy") : "No date"}
                              {" · "}
                              {rt._count?.jointResults ?? 0} joints
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            <span className="text-green-600 font-medium">{rt.totalAccepted}</span>/{rt.totalJoint} accepted
                          </div>
                          <Badge variant="outline" className={TEST_RESULT_COLOR[rt.result as TestResult] ?? ""}>
                            {rt.result}
                          </Badge>
                          <PermissionGate permission={PERMISSIONS.RADIOGRAPHY_UPDATE}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteRadiography.mutate(rt.id);
                              }}
                            >
                              <span className="text-destructive text-xs">Del</span>
                            </Button>
                          </PermissionGate>
                        </div>
                      </div>
                      {expandedRadiographyId === rt.id && (
                        <div className="border-t px-4 py-4">
                          <JointResultsTable radiographyTestId={rt.id} tankProcessId={processId!} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* ELIGIBILITY */}
        <TabsContent value="eligibility" className="mt-4">
          <EligibilityPanel processId={processId!} />
        </TabsContent>

        {/* INSPECTION REQUESTS */}
        <TabsContent value="inspection" className="mt-4">
          <div className="space-y-4">
            <PermissionGate permission={PERMISSIONS.INSPECTION_REQUEST_CREATE}>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setRequestDialogOpen(true)}>
                  <Send className="h-4 w-4 mr-1" /> New Request
                </Button>
              </div>
            </PermissionGate>
            <p className="text-sm text-muted-foreground">
              Inspection requests for this process are listed on the{" "}
              <a href={ROUTES.INSPECTION_REQUESTS} className="underline">
                Inspection Requests
              </a>{" "}
              page.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="xl:h-auto! xl:w-110!">
          <div className="p-4">
            <DialogHeader>
              <DialogTitle>Submit Inspection Request</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <InspectionRequestForm tankProcessId={processId!} onSuccess={() => setRequestDialogOpen(false)} onCancel={() => setRequestDialogOpen(false)} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FindingFormDialog open={findingDialogOpen} onOpenChange={setFindingDialogOpen} tankId={process.tank?.id ?? tankId!} tankProcessId={processId!} />

      {editFinding && <FindingEditDialog open={Boolean(editFinding)} onOpenChange={(open) => !open && setEditFinding(null)} finding={editFinding} />}

      {statusFinding && <FindingStatusDialog open={Boolean(statusFinding)} onOpenChange={(open) => !open && setStatusFinding(null)} finding={statusFinding} />}

      <ConfirmDialog
        open={Boolean(quickCloseFinding)}
        onOpenChange={(open) => !open && setQuickCloseFinding(null)}
        title="Close Finding"
        description={`Close finding "${quickCloseFinding?.findingNo} — ${quickCloseFinding?.title}"? This marks it as resolved.`}
        confirmLabel="Close Finding"
        loading={bulkClose.isPending}
        onConfirm={() => {
          if (!quickCloseFinding) return;
          bulkClose.mutate({ ids: [quickCloseFinding.id] }, { onSuccess: () => setQuickCloseFinding(null) });
        }}
      />

      <ConfirmDialog
        open={bulkCloseFindingOpen}
        onOpenChange={setBulkCloseFindingOpen}
        title="Close Selected Findings"
        description={`Close ${selectedFindingIds.size} selected finding(s)? Already closed or rejected ones will be skipped.`}
        confirmLabel={`Close ${selectedFindingIds.size} Finding(s)`}
        loading={bulkClose.isPending}
        onConfirm={() => {
          bulkClose.mutate(
            { ids: [...selectedFindingIds] },
            {
              onSuccess: () => {
                setSelectedFindingIds(new Set());
                setBulkCloseFindingOpen(false);
              },
            },
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteFindingTarget)}
        onOpenChange={(open) => !open && setDeleteFindingTarget(null)}
        title="Delete Finding"
        description={`Are you sure you want to delete finding "${deleteFindingTarget?.findingNo}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteFinding.isPending}
        onConfirm={() => {
          if (!deleteFindingTarget) return;
          deleteFinding.mutate(deleteFindingTarget.id, { onSuccess: () => setDeleteFindingTarget(null) });
        }}
      />

      <DailyReportFormDialog open={dailyReportDialogOpen} onOpenChange={setDailyReportDialogOpen} tankId={process.tank?.id ?? tankId!} tankProcessId={processId!} />

      {editDailyReport && (
        <DailyReportFormDialog open={Boolean(editDailyReport)} onOpenChange={(open) => !open && setEditDailyReport(null)} tankId={editDailyReport.tankId} tankProcessId={editDailyReport.tankProcessId ?? undefined} report={editDailyReport} />
      )}

      <ConfirmDialog
        open={Boolean(deleteDailyReportTarget)}
        onOpenChange={(open) => !open && setDeleteDailyReportTarget(null)}
        title="Delete Daily Report"
        description={`Delete report dated "${deleteDailyReportTarget ? format(new Date(deleteDailyReportTarget.reportDate), "dd MMM yyyy") : ""}" (${deleteDailyReportTarget ? ACTIVITY_LABEL[deleteDailyReportTarget.activityType] : ""})? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteDailyReport.isPending}
        onConfirm={() => {
          if (!deleteDailyReportTarget) return;
          deleteDailyReport.mutate(deleteDailyReportTarget.id, { onSuccess: () => setDeleteDailyReportTarget(null) });
        }}
      />

      <TestRecordFormDialog open={testRecordDialogOpen} onOpenChange={setTestRecordDialogOpen} tankProcessId={processId!} />

      <RadiographyFormDialog open={radiographyDialogOpen} onOpenChange={setRadiographyDialogOpen} tankProcessId={processId!} />
    </div>
  );
}
