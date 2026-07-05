// src/pages/InspectionRequestDetailPage.tsx
import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Upload, X, CheckCircle2, FileText, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PermissionGate from "@/components/common/PermissionGate";
import RequestStatusBadge from "@/features/inspection-requests/components/RequestStatusBadge";
import TestRecordSection from "@/features/inspection-requests/components/TestRecordSection";
import {
  useInspectionRequest,
  useSubmitConfirmInspectionRequest,
  useUpdateInspectionRequestStatus,
  useUploadInspectionRequestAttachment,
  useRemoveInspectionRequestAttachment,
  useDeleteInspectionRequest,
} from "@/features/inspection-requests/inspection-requests.query";
import { TEST_TYPE_LABELS, OBJECT_TYPE_LABELS, ATTACHMENT_TYPE_LABELS } from "@/features/inspection-requests/inspection-request.constants";
import type { AttachmentType, InspectionObjectType, PersonnelRef } from "@/features/inspection-requests/inspection-requests.api";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";
import { useAuthStore } from "@/stores/auth.store";
import { format } from "date-fns";

function personnelLabel(p: PersonnelRef | null): string {
  if (!p) return "";
  return [p.name, p.position, p.company?.name].filter(Boolean).join(" · ");
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export default function InspectionRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const can = useAuthStore((s) => s.can);
  const role = useAuthStore((s) => s.user?.role ?? "USER");
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const { data: req, isLoading, isError, refetch } = useInspectionRequest(id!);
  const submitConfirm = useSubmitConfirmInspectionRequest();
  const updateStatus = useUpdateInspectionRequestStatus();
  const uploadAttachment = useUploadInspectionRequestAttachment();
  const removeAttachment = useRemoveInspectionRequestAttachment();
  const deleteMutation = useDeleteInspectionRequest();

  const [uploadType, setUploadType] = useState<AttachmentType>("SIGNED_REQUEST_FORM");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <LoadingState />;
  if (isError || !req) return <ErrorState message="Failed to load inspection request." onRetry={() => refetch()} />;

  const canUpdate = can(PERMISSIONS.INSPECTION_REQUEST_UPDATE);
  const hasSignedForm = req.attachments.some((a) => a.attachmentType === "SIGNED_REQUEST_FORM");

  function triggerUpload(type: AttachmentType) {
    setUploadType(type);
    fileInputRef.current?.click();
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length && id) uploadAttachment.mutate({ id, attachmentType: uploadType, files });
    e.target.value = "";
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.INSPECTION_REQUESTS)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold font-mono">{req.requestNo}</h1>
              <RequestStatusBadge status={req.status} />
            </div>
            <p className="text-xs text-muted-foreground">{TEST_TYPE_LABELS[req.testType] ?? req.testType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.INSPECTION_REQUEST_PRINT.replace(":id", req.id))}>
            <Printer className="h-4 w-4 mr-1" /> Print Request Form
          </Button>
          {canUpdate && req.status === "NOT_STARTED" && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.INSPECTION_REQUEST_EDIT.replace(":id", req.id))}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)} title="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: meta + description + items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border p-5">
            <h2 className="text-sm font-medium mb-3">Request Information</h2>
            <MetaRow label="Tank" value={req.tank?.tankNo ?? "General"} />
            <MetaRow label="Process" value={req.tankProcess?.name} />
            <MetaRow label="Request Date" value={format(new Date(req.requestDate), "dd MMM yyyy")} />
            <MetaRow label="Requested By" value={req.requestedByUser?.name} />
            <MetaRow label="Customer / Asset Holder" value={req.assetHolder} />
            <MetaRow label="Execution / 3rd Party" value={req.executionCompany?.name ?? req.executionParty} />
            <MetaRow label="Standard & Code" value={req.standardAndCode} />
            <MetaRow label="Remarks / Location" value={req.requestLocation} />
            <MetaRow label="Received By" value={personnelLabel(req.receivedByUser)} />
            <MetaRow label="Prepared By" value={personnelLabel(req.preparedByUser)} />
            <MetaRow label="Approved By" value={personnelLabel(req.approvedByUser)} />
          </div>

          {req.description && (
            <div className="rounded-lg border p-5">
              <h2 className="text-sm font-medium mb-2">Description</h2>
              <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground">{req.description}</pre>
            </div>
          )}

          <div className="rounded-lg border p-5">
            <h2 className="text-sm font-medium mb-3">Inspection Objects ({req.items.length})</h2>
            <div className="rounded border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">Type</th>
                    <th className="px-2 py-1.5 text-left font-medium">Name</th>
                    <th className="px-2 py-1.5 text-left font-medium">Qty</th>
                    <th className="px-2 py-1.5 text-left font-medium">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {req.items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-2 py-1.5">{OBJECT_TYPE_LABELS[it.objectType as InspectionObjectType] ?? it.objectType}</td>
                      <td className="px-2 py-1.5">{it.objectName ?? "—"}</td>
                      <td className="px-2 py-1.5">
                        {it.quantity} {it.unit ?? ""}
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground">{it.locationDetail ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test records */}
          <div className="rounded-lg border p-5">
            <TestRecordSection requestId={req.id} requestStatus={req.status} items={req.items} canManage={can(PERMISSIONS.TEST_RECORD_CREATE)} isAdmin={isAdmin} />
          </div>
        </div>

        {/* Right: workflow + attachments */}
        <div className="space-y-6">
          {/* Workflow */}
          <div className="rounded-lg border p-5 space-y-3">
            <h2 className="text-sm font-medium">Workflow</h2>
            {req.status === "NOT_STARTED" && (
              <>
                <p className="text-xs text-muted-foreground">Print the form, collect signatures, upload the signed scan, then confirm to start processing.</p>
                <PermissionGate permission={PERMISSIONS.INSPECTION_REQUEST_UPDATE}>
                  <Button className="w-full" size="sm" disabled={!hasSignedForm || submitConfirm.isPending} onClick={() => submitConfirm.mutate(req.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Submit &amp; Confirm
                  </Button>
                </PermissionGate>
                {!hasSignedForm && <p className="text-[11px] text-amber-600">Upload a signed request form to enable confirmation.</p>}
              </>
            )}
            {(req.status === "IN_PROCESS" || req.status === "REPAIR") && (
              <PermissionGate permission={PERMISSIONS.INSPECTION_REQUEST_UPDATE}>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: req.id, status: "REPAIR" })}>
                    Mark Repair
                  </Button>
                  <Button size="sm" className="flex-1" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: req.id, status: "PASSED" })}>
                    Mark Passed
                  </Button>
                </div>
              </PermissionGate>
            )}
            {req.status === "PASSED" && <p className="text-xs text-green-700">This request has passed.</p>}
            <div className="text-[11px] text-muted-foreground space-y-0.5 pt-2 border-t">
              <p>Objects: {req.summary.totalObjects}</p>
              <p>
                Test records: {req.summary.totalTestRecords} · Passed: {req.summary.totalPassed} · Repair: {req.summary.totalRepair}
              </p>
              <p>Progress: {req.summary.progressPercent}%</p>
            </div>
          </div>

          {/* Attachments */}
          <div className="rounded-lg border p-5 space-y-3">
            <h2 className="text-sm font-medium">Attachments</h2>
            <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFiles} />
            <PermissionGate permission={PERMISSIONS.INSPECTION_REQUEST_UPDATE}>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => triggerUpload("SIGNED_REQUEST_FORM")} disabled={uploadAttachment.isPending}>
                  <Upload className="h-3.5 w-3.5 mr-1" /> Signed Form
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerUpload("SKETCH")} disabled={uploadAttachment.isPending}>
                  <Upload className="h-3.5 w-3.5 mr-1" /> Sketch
                </Button>
                <Button variant="outline" size="sm" onClick={() => triggerUpload("SUPPORTING_DOCUMENT")} disabled={uploadAttachment.isPending}>
                  <Upload className="h-3.5 w-3.5 mr-1" /> Document
                </Button>
              </div>
            </PermissionGate>

            {req.attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No attachments yet.</p>
            ) : (
              <div className="space-y-2">
                {req.attachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded border px-2 py-1.5">
                    {/\.(jpg|jpeg|png|webp)$/i.test(a.attachmentUrl) ? <img src={a.attachmentUrl} alt="" className="h-9 w-9 rounded object-cover shrink-0" /> : <FileText className="h-5 w-5 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs font-medium hover:underline block truncate">
                        {ATTACHMENT_TYPE_LABELS[a.attachmentType]}
                      </a>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(a.createdAt), "dd MMM yyyy")}</span>
                    </div>
                    <PermissionGate permission={PERMISSIONS.INSPECTION_REQUEST_UPDATE}>
                      <button onClick={() => id && removeAttachment.mutate({ id, attachmentId: a.id })} title="Remove">
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </PermissionGate>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signatories */}
          <div className="rounded-lg border p-5">
            <h2 className="text-sm font-medium mb-2">Signatories</h2>
            <ul className="text-xs text-muted-foreground space-y-1">
              {req.signatoryTemplate.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Inspection Request"
        description={`Delete request "${req.requestNo}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(req.id, { onSuccess: () => navigate(ROUTES.INSPECTION_REQUESTS) })}
      />
    </div>
  );
}
