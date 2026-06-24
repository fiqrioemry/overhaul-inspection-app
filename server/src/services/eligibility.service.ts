import { pgsql } from "@/lib/database";
import { ChecklistStatusEnum, FindingStatusEnum } from "generated/prisma";

export interface ChecklistDetail {
  criteriaId: string | null;
  name: string;
  status: string;
  required: boolean;
}

export interface FindingDetail {
  id: string;
  findingNo: string;
  status: string;
}

export interface DependencyDetail {
  processName: string;
  requiredStatus: string;
  actualStatus: string;
}

export interface EligibilityResult {
  eligible: boolean;
  checklist: ChecklistDetail[];
  findings: FindingDetail[];
  dependencies: DependencyDetail[];
  reasons: string[];
}

const BLOCKING_FINDING_STATUSES: FindingStatusEnum[] = [FindingStatusEnum.OPEN, FindingStatusEnum.IN_REPAIR];

export class EligibilityService {
  static async checkEligibility(tankProcessId: string): Promise<EligibilityResult> {
    const tankProcess = await pgsql.tankProcess.findUnique({
      where: { id: tankProcessId },
      include: { project: { select: { id: true, tank: { select: { id: true, tankNo: true } } } } },
    });

    if (!tankProcess) {
      return {
        eligible: false,
        checklist: [],
        findings: [],
        dependencies: [],
        reasons: ["Process not found"],
      };
    }

    const [checklistItems, blockingFindings, processDeps] = await Promise.all([
      pgsql.checklistResult.findMany({
        where: { tankProcessId },
        include: { criteria: { select: { id: true, name: true, isRequired: true } } },
      }),
      pgsql.finding.findMany({
        where: {
          tankProcessId,
          isBlocking: true,
          status: { in: BLOCKING_FINDING_STATUSES },
          deletedAt: null,
        },
        select: { id: true, findingNo: true, status: true },
      }),
      pgsql.processDependency.findMany({
        where: { processTemplateId: tankProcess.processTemplateId },
        include: { requiredProcessTemplate: { select: { id: true, name: true } } },
      }),
    ]);

    const reasons: string[] = [];

    // 1. Checklist check — criteria is null for CUSTOM items; fall back to row fields.
    const checklistDetails: ChecklistDetail[] = checklistItems.map((item) => ({
      criteriaId: item.criteriaId,
      name: item.criteria?.name ?? item.customName ?? "Checklist item",
      status: item.status,
      required: item.isRequired,
    }));

    const failedRequired = checklistItems.filter(
      (item) => item.isRequired && item.status !== ChecklistStatusEnum.PASSED,
    );
    if (failedRequired.length > 0) {
      reasons.push(`${failedRequired.length} required checklist item(s) not passed`);
    }

    // 2. Findings check
    const findingDetails: FindingDetail[] = blockingFindings.map((f) => ({
      id: f.id,
      findingNo: f.findingNo,
      status: f.status,
    }));
    if (blockingFindings.length > 0) {
      reasons.push(`${blockingFindings.length} blocking finding(s) still open`);
    }

    // 3. Dependency check (now based on process status, not result)
    const dependencyDetails: DependencyDetail[] = [];
    for (const dep of processDeps) {
      const dependedProcess = await pgsql.tankProcess.findUnique({
        where: {
          projectId_processTemplateId: {
            projectId: tankProcess.projectId,
            processTemplateId: dep.requiredProcessTemplateId,
          },
        },
        select: { status: true },
      });

      const actualStatus = dependedProcess?.status ?? "NOT_FOUND";
      dependencyDetails.push({
        processName: dep.requiredProcessTemplate.name,
        requiredStatus: dep.requiredStatus,
        actualStatus,
      });

      if (actualStatus !== dep.requiredStatus) {
        reasons.push(`Dependency "${dep.requiredProcessTemplate.name}" not ${dep.requiredStatus}`);
      }
    }

    return {
      eligible: reasons.length === 0,
      checklist: checklistDetails,
      findings: findingDetails,
      dependencies: dependencyDetails,
      reasons,
    };
  }
}
