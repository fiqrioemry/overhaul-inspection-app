import { pgsql } from "@/lib/database";
import {
  FindingStatusEnum,
  InspectionRequestStatusEnum,
  ProcessStatusEnum,
  TankAssetStatusEnum,
  TankProjectStatusEnum,
} from "generated/prisma";
import type { DashboardSummary, FindingSummary, TankProgressItem, TestSummary } from "./dashboard.types";

const ACTIVE_PROJECT_STATUSES: TankProjectStatusEnum[] = [
  TankProjectStatusEnum.PLANNED,
  TankProjectStatusEnum.IN_PROGRESS,
  TankProjectStatusEnum.ON_HOLD,
];

export class DashboardService {
  static async getSummary(): Promise<DashboardSummary> {
    const [
      totalTanks,
      operationalTanks,
      underOverhaulTanks,
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      openFindings,
      criticalFindings,
      pendingRequests,
      totalProcesses,
      completedProcesses,
    ] = await Promise.all([
      pgsql.tank.count({ where: { deletedAt: null } }),
      pgsql.tank.count({ where: { deletedAt: null, assetStatus: TankAssetStatusEnum.OPERATIONAL } }),
      pgsql.tank.count({ where: { deletedAt: null, assetStatus: TankAssetStatusEnum.UNDER_OVERHAUL } }),
      pgsql.tankProject.count({ where: { deletedAt: null } }),
      pgsql.tankProject.count({ where: { deletedAt: null, status: { in: ACTIVE_PROJECT_STATUSES } } }),
      pgsql.tankProject.count({ where: { deletedAt: null, status: TankProjectStatusEnum.COMPLETED } }),
      pgsql.tankProject.count({
        where: {
          deletedAt: null,
          estimatedFinishDate: { lt: new Date() },
          status: { notIn: [TankProjectStatusEnum.COMPLETED, TankProjectStatusEnum.CANCELLED] },
        },
      }),
      pgsql.finding.count({ where: { status: FindingStatusEnum.OPEN, deletedAt: null } }),
      pgsql.finding.count({ where: { status: FindingStatusEnum.OPEN, severity: "CRITICAL", deletedAt: null } }),
      pgsql.inspectionRequest.count({ where: { status: { not: InspectionRequestStatusEnum.PASSED }, deletedAt: null } }),
      pgsql.tankProcess.count({}),
      pgsql.tankProcess.count({ where: { status: ProcessStatusEnum.COMPLETED } }),
    ]);

    return {
      tanks: { total: totalTanks, operational: operationalTanks, underOverhaul: underOverhaulTanks },
      projects: { total: totalProjects, active: activeProjects, completed: completedProjects, overdue: overdueProjects },
      processes: { total: totalProcesses, completed: completedProcesses },
      findings: { open: openFindings, critical: criticalFindings },
      inspectionRequests: { pending: pendingRequests },
    };
  }

  static async getTankProgress(): Promise<TankProgressItem[]> {
    const projects = await pgsql.tankProject.findMany({
      where: { deletedAt: null, status: { in: ACTIVE_PROJECT_STATUSES } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        tank: { select: { id: true, tankNo: true, tankName: true } },
        contractorCompany: { select: { id: true, name: true } },
        inspectionCompany: { select: { id: true, name: true } },
        processes: {
          orderBy: { sequenceOrder: "asc" },
          select: { id: true, name: true, type: true, sequenceOrder: true, status: true },
        },
        _count: { select: { findings: true } },
      },
    });

    return projects.map((project) => {
      const total = project.processes.length;
      const completed = project.processes.filter((p) => p.status === ProcessStatusEnum.COMPLETED).length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: project.id,
        projectNo: project.projectNo,
        type: project.type,
        status: project.status,
        startDate: project.startDate,
        estimatedFinishDate: project.estimatedFinishDate,
        createdAt: project.createdAt,
        tank: project.tank,
        contractorCompany: project.contractorCompany,
        inspectionCompany: project.inspectionCompany,
        processes: project.processes,
        _count: project._count,
        progress,
      };
    });
  }

  static async getFindingSummary(): Promise<FindingSummary> {
    const [byStatus, bySeverity, recentFindings] = await Promise.all([
      pgsql.finding.groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      pgsql.finding.groupBy({
        by: ["severity"],
        where: { status: FindingStatusEnum.OPEN, deletedAt: null },
        _count: { id: true },
      }),
      pgsql.finding.findMany({
        where: { deletedAt: null, status: { in: [FindingStatusEnum.OPEN, FindingStatusEnum.IN_REPAIR] } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          tank: { select: { id: true, tankNo: true } },
          tankProcess: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count.id })),
      bySeverity: bySeverity.map((g) => ({ severity: g.severity, count: g._count.id })),
      recent: recentFindings,
    };
  }

  static async getTestSummary(): Promise<TestSummary> {
    const [recentTestRecords, recentRequests, byType] = await Promise.all([
      pgsql.testRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          inspectionRequest: { select: { id: true, requestNo: true, testType: true } },
          tankProcess: {
            select: {
              id: true,
              name: true,
              project: { select: { id: true, tank: { select: { id: true, tankNo: true } } } },
            },
          },
          createdByUser: { select: { id: true, name: true } },
        },
      }),
      pgsql.inspectionRequest.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { tank: { select: { id: true, tankNo: true } } },
      }),
      pgsql.inspectionRequest.groupBy({
        by: ["testType"],
        where: { deletedAt: null },
        _count: { id: true },
      }),
    ]);

    const [passedTests, repairTests, notStartedTests, reqNotStarted, reqInProcess, reqRepair, reqPassed] = await Promise.all([
      pgsql.testRecord.count({ where: { status: "PASSED" } }),
      pgsql.testRecord.count({ where: { status: "REPAIR" } }),
      pgsql.testRecord.count({ where: { status: "NOT_STARTED" } }),
      pgsql.inspectionRequest.count({ where: { status: "NOT_STARTED", deletedAt: null } }),
      pgsql.inspectionRequest.count({ where: { status: "IN_PROCESS", deletedAt: null } }),
      pgsql.inspectionRequest.count({ where: { status: "REPAIR", deletedAt: null } }),
      pgsql.inspectionRequest.count({ where: { status: "PASSED", deletedAt: null } }),
    ]);

    return {
      testRecords: { passed: passedTests, repair: repairTests, notStarted: notStartedTests, recent: recentTestRecords },
      inspectionRequests: {
        notStarted: reqNotStarted,
        inProcess: reqInProcess,
        repair: reqRepair,
        passed: reqPassed,
        byType: byType.map((g) => ({ testType: g.testType, count: g._count.id })),
        recent: recentRequests.map((r) => ({
          id: r.id,
          requestNo: r.requestNo,
          testType: r.testType,
          status: r.status,
          createdAt: r.createdAt,
          tank: r.tank,
        })),
      },
    };
  }
}
