import { pgsql } from "@/lib/database";
import { ChecklistStatusEnum, FindingStatusEnum } from "generated/prisma";

export interface ChecklistDetail {
  criteriaId: string;
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
  requiredResult: string;
  actualResult: string;
}

export interface EligibilityResult {
  eligible: boolean;
  checklist: ChecklistDetail[];
  findings: FindingDetail[];
  dependencies: DependencyDetail[];
  reasons: string[];
}

const BLOCKING_FINDING_STATUSES: FindingStatusEnum[] = [
  FindingStatusEnum.OPEN,
  FindingStatusEnum.IN_REPAIR,
  FindingStatusEnum.REPAIRED,
];

export class EligibilityService {
  static async checkEligibility(tankProcessId: string): Promise<EligibilityResult> {
    const tankProcess = await pgsql.tankProcess.findUnique({
      where: { id: tankProcessId },
      include: { tank: { select: { id: true, tankNo: true } } },
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

    // 1. Checklist check
    const checklistDetails: ChecklistDetail[] = checklistItems.map((item) => ({
      criteriaId: item.criteriaId,
      name: item.criteria.name,
      status: item.status,
      required: item.criteria.isRequired,
    }));

    const failedRequired = checklistItems.filter(
      (item) =>
        item.criteria.isRequired &&
        item.status !== ChecklistStatusEnum.PASSED &&
        item.status !== ChecklistStatusEnum.NOT_APPLICABLE,
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

    // 3. Dependency check
    const dependencyDetails: DependencyDetail[] = [];
    for (const dep of processDeps) {
      const dependedProcess = await pgsql.tankProcess.findUnique({
        where: {
          tankId_processTemplateId: {
            tankId: tankProcess.tankId,
            processTemplateId: dep.requiredProcessTemplateId,
          },
        },
        select: { result: true },
      });

      const actualResult = dependedProcess?.result ?? "NOT_FOUND";
      dependencyDetails.push({
        processName: dep.requiredProcessTemplate.name,
        requiredResult: dep.requiredResult,
        actualResult,
      });

      if (actualResult !== dep.requiredResult) {
        reasons.push(`Dependency "${dep.requiredProcessTemplate.name}" not ${dep.requiredResult}`);
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
