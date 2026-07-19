import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { InspectionRequestStatusEnum, InspectionRequestTypeEnum, InspectionRequestAttachmentTypeEnum, CompanyType } from "generated/prisma";
import { FileService } from "@/modules/files/file.service";
import { Prisma } from "generated/prisma";
import { InspectionFormTemplateRepository } from "@/modules/inspection-form-templates/inspection-form-template.repository";
import { InspectionRequestRepository } from "./inspection-request.repository";
import { InspectionRequestAttachmentRepository } from "./inspection-request-attachment.repository";
import { OBJECT_OPTIONAL_TEST_TYPES, TEST_TYPE_LABELS, getSignatoryTemplate } from "@/config/constant/inspection-request.constant";
import type { CreateInspectionRequestRequest, UpdateInspectionRequestRequest, ListInspectionRequestsQuery, UpdateStatusRequest, InspectionRequestItemInput } from "./inspection-request.schema";
import type { InspectionRequestListItem, InspectionRequestListResult, InspectionRequestSummaryCounts } from "./inspection-request.types";

const MAX_ATTACHMENTS = 15;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

const OBJECT_TYPE_LABELS: Record<string, string> = {
  MANHOLE: "Manhole",
  COD: "COD",
  NOZZLE: "Nozzle",
  SHELL_PLATE: "Shell Plate",
  BOTTOM_PLATE: "Bottom Plate",
  ROOF_PLATE: "Roof Plate",
  REINFORCEMENT_PAD: "Reinforcement Pad",
  PIPE: "Pipe",
  STEAM_COIL: "Steam Coil",
  WELD_JOINT: "Weld Joint",
  ANNULAR_PLATE: "Annular Plate",
  FLOOR_PLATE: "Floor Plate",
  VALVE: "Valve",
  FLANGE: "Flange",
  FITTING: "Fitting",
  MATERIAL: "Material",
  OTHER: "Object",
};

function buildRequestDescription(testType: InspectionRequestTypeEnum, items: InspectionRequestItemInput[], tankNo?: string | null): string {
  const label = TEST_TYPE_LABELS[testType] ?? "Inspection";
  if (items.length === 0) {
    return tankNo ? `Lakukan ${label} pada tangki ${tankNo}.` : `Lakukan ${label}.`;
  }
  const head = tankNo ? `Lakukan ${label} pada tangki ${tankNo}:` : `Lakukan ${label} pada objek berikut:`;
  const lines = items.map((item, idx) => {
    const objectLabel = OBJECT_TYPE_LABELS[item.objectType] ?? item.objectType;
    const name = item.objectName ? ` ${item.objectName}` : "";
    const qty = `${item.quantity} ${item.unit ?? "Pcs"}`;
    const loc = item.locationDetail ? ` (${item.locationDetail})` : "";
    return `${idx + 1}. Lakukan ${label} pada ${objectLabel}${name} ${qty}${loc}.`;
  });
  return [head, ...lines].join("\n");
}

function computeSummary(items: Array<unknown>, testRecords: Array<{ status: string }>): InspectionRequestSummaryCounts {
  const totalObjects = items.length;
  const totalTestRecords = testRecords.length;
  const totalPassed = testRecords.filter((t) => t.status === "PASSED").length;
  const totalRepair = testRecords.filter((t) => t.status === "REPAIR").length;
  const totalNotStarted = testRecords.filter((t) => t.status === "NOT_STARTED").length;
  const denominator = totalObjects > 0 ? totalObjects : totalTestRecords;
  const progressPercent = denominator > 0 ? Math.round((totalPassed / denominator) * 100) : 0;
  return { totalObjects, totalTestRecords, totalPassed, totalRepair, totalNotStarted, progressPercent };
}

function toItemRows(items: InspectionRequestItemInput[]) {
  return items.map((item, idx) => ({
    objectType: item.objectType,
    objectName: item.objectName ?? null,
    quantity: item.quantity,
    unit: item.unit ?? null,
    locationDetail: item.locationDetail ?? null,
    remarks: item.remarks ?? null,
    sortOrder: idx,
  }));
}

export class InspectionRequestService {
  // Request numbers follow the format `001/NDT/SSIE/{year}`, where the leading number is a
  // per-year running sequence sourced from the count of existing requests for that year.
  private static async generateRequestNo(): Promise<string> {
    const year = new Date().getFullYear();
    const suffix = `/NDT/SSIE/${year}`;
    const count = await InspectionRequestRepository.countForRequestNoSuffix(suffix);
    return `${String(count + 1).padStart(3, "0")}${suffix}`;
  }

  // Resolves and validates the tank / project / process triple. project + tank are
  // derived from the process when present; otherwise from the project.
  private static async resolveContext(tankId?: string | null, projectId?: string | null, tankProcessId?: string | null): Promise<{ tankNo: string | null; tankId: string | null; projectId: string | null }> {
    let resolvedTankId = tankId ?? null;
    let resolvedProjectId = projectId ?? null;

    if (tankProcessId) {
      const tankProcess = await pgsql.tankProcess.findUnique({
        where: { id: tankProcessId },
        include: { project: { select: { id: true, tankId: true } } },
      });
      if (!tankProcess) throw new HTTPException(404, { message: "Tank process not found", cause: "PROCESS_NOT_FOUND" });
      if (resolvedProjectId && resolvedProjectId !== tankProcess.projectId) {
        throw new HTTPException(422, { message: "Tank process does not belong to the provided project", cause: "PROCESS_PROJECT_MISMATCH" });
      }
      if (resolvedTankId && resolvedTankId !== tankProcess.project.tankId) {
        throw new HTTPException(422, { message: "Tank process does not belong to the provided tank", cause: "PROCESS_TANK_MISMATCH" });
      }
      resolvedProjectId = tankProcess.projectId;
      resolvedTankId = tankProcess.project.tankId;
    } else if (resolvedProjectId) {
      const project = await pgsql.tankProject.findFirst({ where: { id: resolvedProjectId, deletedAt: null }, select: { tankId: true } });
      if (!project) throw new HTTPException(404, { message: "Tank project not found", cause: "PROJECT_NOT_FOUND" });
      if (resolvedTankId && resolvedTankId !== project.tankId) {
        throw new HTTPException(422, { message: "Project does not belong to the provided tank", cause: "PROJECT_TANK_MISMATCH" });
      }
      resolvedTankId = project.tankId;
    }

    let tankNo: string | null = null;
    if (resolvedTankId) {
      const tank = await pgsql.tank.findFirst({ where: { id: resolvedTankId, deletedAt: null }, select: { tankNo: true } });
      if (!tank) throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
      tankNo = tank.tankNo;
    }

    return { tankNo, tankId: resolvedTankId, projectId: resolvedProjectId };
  }

  private static async assertUserInCompanyType(userId: string, companyType: CompanyType, errorMessage: string) {
    const user = await pgsql.user.findFirst({
      where: { id: userId, deletedAt: null, status: "ACTIVE" },
      select: { company: { select: { type: true, deletedAt: true, isActive: true } } },
    });
    if (!user) throw new HTTPException(404, { message: "Selected user not found", cause: "USER_NOT_FOUND" });
    if (!user.company || user.company.deletedAt || !user.company.isActive || user.company.type !== companyType) {
      throw new HTTPException(422, { message: errorMessage, cause: "INVALID_USER_COMPANY" });
    }
  }

  private static async assertPersonnel(data: { executionCompanyId?: string | null; receivedById?: string | null; preparedById?: string | null; approvedById?: string | null }) {
    if (data.executionCompanyId) {
      const company = await pgsql.company.findFirst({
        where: { id: data.executionCompanyId, deletedAt: null, isActive: true },
        select: { type: true },
      });
      if (!company) throw new HTTPException(404, { message: "Execution company not found", cause: "EXECUTION_COMPANY_NOT_FOUND" });
      if (company.type !== CompanyType.INSPECTOR_COMPANY) {
        throw new HTTPException(422, { message: "Execution company must be an inspector company", cause: "INVALID_EXECUTION_COMPANY" });
      }
    }
    if (data.receivedById) {
      await this.assertUserInCompanyType(data.receivedById, CompanyType.INSPECTOR_COMPANY, "Received by must be selected from inspector company users");
    }
    if (data.preparedById) {
      await this.assertUserInCompanyType(data.preparedById, CompanyType.OWNER, "Prepared by must be selected from owner company users");
    }
    if (data.approvedById) {
      await this.assertUserInCompanyType(data.approvedById, CompanyType.OWNER, "Approved by must be selected from owner company users");
    }
  }

  static async createRequest(c: Context, data: CreateInspectionRequestRequest, files: File[], userId: string) {
    const ctx = await this.resolveContext(data.tankId, data.projectId, data.tankProcessId);
    const tankNo = ctx.tankNo;
    await this.assertPersonnel(data);

    if (files.length > MAX_ATTACHMENTS) {
      throw new HTTPException(400, { message: `Maximum ${MAX_ATTACHMENTS} attachments are allowed`, cause: "ATTACHMENT_LIMIT_EXCEEDED" });
    }
    validateFiles(files);

    const requestNo = await this.generateRequestNo();
    const description = data.description?.trim() || buildRequestDescription(data.testType, data.items, tankNo);

    // Attach the active clearance-form template for this test type (none exists
    // for PENETRANT_TEST / RADIOGRAPHY_TEST, which keep the legacy print form).
    // The snapshot freezes the template so already-printed requests never change
    // when the master template is revised later.
    const formTemplate = await InspectionFormTemplateRepository.findActiveByTestType(data.testType);
    const formTemplateSnapshot = formTemplate
      ? ({
          id: formTemplate.id,
          code: formTemplate.code,
          testType: formTemplate.testType,
          title: formTemplate.title,
          revision: formTemplate.revision,
          defaultStandardAndCode: formTemplate.defaultStandardAndCode,
          procedureText: formTemplate.procedureText,
          acceptanceCriteriaText: formTemplate.acceptanceCriteriaText,
          checklistItems: formTemplate.checklistItems,
        } as Prisma.InputJsonValue)
      : undefined;
    const standardAndCode = data.standardAndCode ?? formTemplate?.defaultStandardAndCode ?? null;

    // Upload supporting files to MinIO outside the transaction
    const fileRecords = files.length > 0 ? await Promise.all(files.map((f) => FileService.generateFileRecord(f, "INSPECTION_REQUEST"))) : [];
    if (fileRecords.length > 0) {
      await Promise.all(fileRecords.map((fr) => FileService.uploadFileToStorage(c, fr)));
    }

    const created = await pgsql.$transaction(async (tx) => {
      const request = await InspectionRequestRepository.createWithItems(
        tx,
        {
          requestNo,
          testType: data.testType,
          status: InspectionRequestStatusEnum.NOT_STARTED,
          requestDate: new Date(data.requestDate),
          assetHolder: data.assetHolder ?? null,
          executionParty: data.executionParty ?? null,
          standardAndCode,
          requestLocation: data.requestLocation ?? null,
          description,
          remarks: data.remarks ?? null,
          tank: ctx.tankId ? { connect: { id: ctx.tankId } } : undefined,
          project: ctx.projectId ? { connect: { id: ctx.projectId } } : undefined,
          tankProcess: data.tankProcessId ? { connect: { id: data.tankProcessId } } : undefined,
          requestedByUser: { connect: { id: data.requestedBy ?? userId } },
          executionCompany: data.executionCompanyId ? { connect: { id: data.executionCompanyId } } : undefined,
          receivedByUser: data.receivedById ? { connect: { id: data.receivedById } } : undefined,
          preparedByUser: data.preparedById ? { connect: { id: data.preparedById } } : undefined,
          approvedByUser: data.approvedById ? { connect: { id: data.approvedById } } : undefined,
          formTemplate: formTemplate ? { connect: { id: formTemplate.id } } : undefined,
          ...(formTemplateSnapshot !== undefined && { formTemplateSnapshot }),
        },
        toItemRows(data.items),
      );

      if (fileRecords.length > 0) {
        const storedFiles = await Promise.all(
          fileRecords.map((fr) =>
            tx.fileStorage.create({
              data: {
                url: fr.url!,
                isUsed: true,
                path: fr.path!,
                meta: fr.metadata!,
                module: "INSPECTION_REQUEST",
                size: fr.size!,
                createdBy: userId,
                mimeType: fr.mimeType ?? null,
              },
              select: { id: true, url: true },
            }),
          ),
        );
        await InspectionRequestAttachmentRepository.createMany(
          tx,
          storedFiles.map((f, idx) => ({
            inspectionRequestId: request.id,
            fileStorageId: f.id,
            attachmentUrl: f.url,
            attachmentType: InspectionRequestAttachmentTypeEnum.SUPPORTING_DOCUMENT,
            sortOrder: idx,
          })),
        );
      }

      return request;
    });

    return this.getRequestById(created.id);
  }

  static async listRequests(query: ListInspectionRequestsQuery): Promise<InspectionRequestListResult> {
    const { requests, total } = await InspectionRequestRepository.findMany(query);
    const totalPages = total > 0 ? Math.ceil(total / query.limit) : 0;

    const data: InspectionRequestListItem[] = requests.map((r) => ({
      id: r.id,
      requestNo: r.requestNo,
      testType: r.testType,
      status: r.status,
      requestDate: r.requestDate,
      tankId: r.tankId,
      projectId: r.projectId,
      tankProcessId: r.tankProcessId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tank: r.tank ?? null,
      project: r.project ?? null,
      tankProcess: r.tankProcess ?? null,
      requestedByUser: r.requestedByUser ?? null,
      summary: computeSummary(r.items, r.testRecords),
    }));

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  static async getRequestById(id: string) {
    const request = await InspectionRequestRepository.findById(id);
    if (!request) throw new HTTPException(404, { message: "Inspection request not found", cause: "REQUEST_NOT_FOUND" });

    // Inspection logo for the printable request form: take it from the OWNER
    // company of the approver (approvedRequests user); fall back to any active
    // OWNER company logo when the approver is unset or has no resolvable logo.
    const approverCompany = request.approvedByUser?.company;
    const approverLogoUrl = approverCompany?.type === "OWNER" ? (approverCompany.logoFile?.url ?? null) : null;
    const inspectionLogoUrl = approverLogoUrl ?? (await InspectionRequestRepository.findOwnerCompanyLogoUrl());

    // Contractor company for the clearance form's "Requested By" signature block:
    // from the request's project, else the tank's most recent active project.
    const contractorCompany = request.project?.contractorCompany ?? (request.tankId ? await InspectionRequestRepository.findTankContractorCompany(request.tankId) : null);

    return {
      ...request,
      inspectionLogoUrl,
      contractorCompany,
      signatoryTemplate: getSignatoryTemplate(request.testType),
      summary: computeSummary(request.items, request.testRecords),
    };
  }

  static async updateRequest(id: string, data: UpdateInspectionRequestRequest) {
    const request = await InspectionRequestRepository.findById(id);
    if (!request) throw new HTTPException(404, { message: "Inspection request not found", cause: "REQUEST_NOT_FOUND" });

    if (request.status !== InspectionRequestStatusEnum.NOT_STARTED) {
      throw new HTTPException(422, {
        message: "Request can only be edited while it is NOT_STARTED",
        cause: "REQUEST_NOT_EDITABLE",
      });
    }

    const nextTankId = data.tankId !== undefined ? data.tankId : request.tankId;
    const nextProjectId = data.projectId !== undefined ? data.projectId : request.projectId;
    const nextProcessId = data.tankProcessId !== undefined ? data.tankProcessId : request.tankProcessId;
    const ctx = await this.resolveContext(nextTankId, nextProjectId, nextProcessId);
    await this.assertPersonnel(data);

    // Mirror create semantics: an empty description means "auto-generate from objects".
    const nextTestType = data.testType ?? request.testType;
    const nextItems = data.items ?? request.items.map((it) => ({ ...it, objectName: it.objectName ?? undefined, unit: it.unit ?? undefined, locationDetail: it.locationDetail ?? undefined, remarks: it.remarks ?? undefined }));
    if (!OBJECT_OPTIONAL_TEST_TYPES.has(nextTestType) && nextItems.length === 0) {
      throw new HTTPException(400, {
        message: "At least one inspection object is required for this test type",
        cause: "ITEMS_REQUIRED",
      });
    }
    const nextDescription = data.description === undefined ? undefined : data.description?.trim() || buildRequestDescription(nextTestType, nextItems, ctx.tankNo);

    // When the test type changes, re-resolve the active clearance-form template
    // so the linked template + snapshot stay consistent with the new type.
    let templateUpdate: Prisma.InspectionRequestUpdateInput = {};
    if (data.testType && data.testType !== request.testType) {
      const formTemplate = await InspectionFormTemplateRepository.findActiveByTestType(data.testType);
      templateUpdate = {
        formTemplate: formTemplate ? { connect: { id: formTemplate.id } } : { disconnect: true },
        formTemplateSnapshot: formTemplate
          ? ({
              id: formTemplate.id,
              code: formTemplate.code,
              testType: formTemplate.testType,
              title: formTemplate.title,
              revision: formTemplate.revision,
              defaultStandardAndCode: formTemplate.defaultStandardAndCode,
              procedureText: formTemplate.procedureText,
              acceptanceCriteriaText: formTemplate.acceptanceCriteriaText,
              checklistItems: formTemplate.checklistItems,
            } as Prisma.InputJsonValue)
          : Prisma.DbNull,
      };
    }

    await pgsql.$transaction(async (tx) => {
      await tx.inspectionRequest.update({
        where: { id },
        data: {
          ...(data.testType && { testType: data.testType }),
          ...(data.requestDate && { requestDate: new Date(data.requestDate) }),
          tank: ctx.tankId ? { connect: { id: ctx.tankId } } : { disconnect: true },
          project: ctx.projectId ? { connect: { id: ctx.projectId } } : { disconnect: true },
          ...(data.tankProcessId !== undefined && {
            tankProcess: data.tankProcessId ? { connect: { id: data.tankProcessId } } : { disconnect: true },
          }),
          ...(data.assetHolder !== undefined && { assetHolder: data.assetHolder }),
          ...(data.executionParty !== undefined && { executionParty: data.executionParty }),
          ...(data.executionCompanyId !== undefined && {
            executionCompany: data.executionCompanyId ? { connect: { id: data.executionCompanyId } } : { disconnect: true },
          }),
          ...(data.receivedById !== undefined && {
            receivedByUser: data.receivedById ? { connect: { id: data.receivedById } } : { disconnect: true },
          }),
          ...(data.preparedById !== undefined && {
            preparedByUser: data.preparedById ? { connect: { id: data.preparedById } } : { disconnect: true },
          }),
          ...(data.approvedById !== undefined && {
            approvedByUser: data.approvedById ? { connect: { id: data.approvedById } } : { disconnect: true },
          }),
          ...(data.standardAndCode !== undefined && { standardAndCode: data.standardAndCode }),
          ...(data.requestLocation !== undefined && { requestLocation: data.requestLocation }),
          ...(nextDescription !== undefined && { description: nextDescription }),
          ...(data.remarks !== undefined && { remarks: data.remarks }),
          ...templateUpdate,
        },
      });

      if (data.items) {
        await InspectionRequestRepository.replaceItems(tx, id, toItemRows(data.items));
      }
    });

    return this.getRequestById(id);
  }

  static async submitConfirm(id: string) {
    const request = await InspectionRequestRepository.findById(id);
    if (!request) throw new HTTPException(404, { message: "Inspection request not found", cause: "REQUEST_NOT_FOUND" });

    if (request.status !== InspectionRequestStatusEnum.NOT_STARTED) {
      throw new HTTPException(422, {
        message: "Only NOT_STARTED requests can be submitted",
        cause: "INVALID_REQUEST_STATUS",
      });
    }

    const signedCount = await InspectionRequestAttachmentRepository.countSignedForm(id);
    if (signedCount === 0) {
      throw new HTTPException(422, {
        message: "A signed request form (attachmentType SIGNED_REQUEST_FORM) must be uploaded before confirming",
        cause: "SIGNED_FORM_REQUIRED",
      });
    }

    await InspectionRequestRepository.update(id, {
      status: InspectionRequestStatusEnum.IN_PROCESS,
      confirmedAt: new Date(),
    });

    return this.getRequestById(id);
  }

  static async updateStatus(id: string, data: UpdateStatusRequest) {
    const request = await InspectionRequestRepository.findById(id);
    if (!request) throw new HTTPException(404, { message: "Inspection request not found", cause: "REQUEST_NOT_FOUND" });

    if (request.status === InspectionRequestStatusEnum.NOT_STARTED) {
      throw new HTTPException(422, {
        message: "Submit and confirm the signed request form before updating result status",
        cause: "REQUEST_NOT_CONFIRMED",
      });
    }

    // Allowed: IN_PROCESS -> REPAIR/PASSED, REPAIR -> PASSED
    const allowed =
      (request.status === InspectionRequestStatusEnum.IN_PROCESS && (data.status === InspectionRequestStatusEnum.REPAIR || data.status === InspectionRequestStatusEnum.PASSED)) ||
      (request.status === InspectionRequestStatusEnum.REPAIR && data.status === InspectionRequestStatusEnum.PASSED);

    if (!allowed) {
      throw new HTTPException(422, {
        message: `Cannot change status from ${request.status} to ${data.status}`,
        cause: "INVALID_STATUS_TRANSITION",
      });
    }

    await InspectionRequestRepository.update(id, {
      status: data.status,
      ...(data.remarks !== undefined && { remarks: data.remarks }),
    });

    return this.getRequestById(id);
  }

  static async uploadAttachment(c: Context, id: string, attachmentType: InspectionRequestAttachmentTypeEnum, caption: string | undefined, files: File[], userId: string) {
    const request = await InspectionRequestRepository.findById(id);
    if (!request) throw new HTTPException(404, { message: "Inspection request not found", cause: "REQUEST_NOT_FOUND" });
    if (files.length === 0) throw new HTTPException(400, { message: "At least one file is required" });
    if (files.length > MAX_ATTACHMENTS) {
      throw new HTTPException(400, { message: `Maximum ${MAX_ATTACHMENTS} attachments are allowed`, cause: "ATTACHMENT_LIMIT_EXCEEDED" });
    }
    validateFiles(files);

    const fileRecords = await Promise.all(files.map((f) => FileService.generateFileRecord(f, "INSPECTION_REQUEST")));
    await Promise.all(fileRecords.map((fr) => FileService.uploadFileToStorage(c, fr)));

    const existing = await InspectionRequestAttachmentRepository.findActiveByRequestId(id);
    const baseSort = existing.length;

    await pgsql.$transaction(async (tx) => {
      const storedFiles = await Promise.all(
        fileRecords.map((fr) =>
          tx.fileStorage.create({
            data: {
              url: fr.url!,
              isUsed: true,
              path: fr.path!,
              meta: fr.metadata!,
              module: "INSPECTION_REQUEST",
              size: fr.size!,
              createdBy: userId,
              mimeType: fr.mimeType ?? null,
            },
            select: { id: true, url: true },
          }),
        ),
      );
      await InspectionRequestAttachmentRepository.createMany(
        tx,
        storedFiles.map((f, idx) => ({
          inspectionRequestId: id,
          fileStorageId: f.id,
          attachmentUrl: f.url,
          attachmentType,
          caption: idx === 0 ? caption : undefined,
          sortOrder: baseSort + idx,
        })),
      );
    });

    return this.getRequestById(id);
  }

  static async removeAttachment(id: string, attachmentId: string) {
    const request = await InspectionRequestRepository.findById(id);
    if (!request) throw new HTTPException(404, { message: "Inspection request not found", cause: "REQUEST_NOT_FOUND" });

    const attachment = await InspectionRequestAttachmentRepository.findActiveById(attachmentId, id);
    if (!attachment) throw new HTTPException(404, { message: "Attachment not found", cause: "ATTACHMENT_NOT_FOUND" });

    await pgsql.$transaction(async (tx) => {
      await InspectionRequestAttachmentRepository.softDeleteById(tx, attachmentId, id);
      await tx.fileStorage.updateMany({ where: { id: attachment.fileStorageId }, data: { isUsed: false } });
    });

    return this.getRequestById(id);
  }

  static async deleteRequest(id: string) {
    const request = await InspectionRequestRepository.findById(id);
    if (!request) throw new HTTPException(404, { message: "Inspection request not found", cause: "REQUEST_NOT_FOUND" });
    await InspectionRequestRepository.softDelete(id);
  }

  static async listTankOptions() {
    return InspectionRequestRepository.findTankOptions();
  }

  static async listTankProcessOptions(tankId: string) {
    const tank = await pgsql.tank.findFirst({ where: { id: tankId, deletedAt: null }, select: { id: true } });
    if (!tank) throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    return InspectionRequestRepository.findTankProcessOptions(tankId);
  }
}
