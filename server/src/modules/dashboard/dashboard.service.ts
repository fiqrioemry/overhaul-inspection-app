import { pgsql } from "@/lib/database";
import { FindingStatusEnum, InspectionRequestStatusEnum, ProcessStatusEnum, StatusEnum } from "generated/prisma";
import type { DashboardSummary, FindingSummary, TankProgressItem, TestSummary } from "./dashboard.types";

export class DashboardService {
  static async getSummary(): Promise<DashboardSummary> {
    const [
      totalTanks,
      activeTanks,
      completedTanks,
      openFindings,
      criticalFindings,
      pendingRequests,
      totalProcesses,
      completedProcesses,
    ] = await Promise.all([
      pgsql.tank.count({ where: { deletedAt: null } }),
      pgsql.tank.count({ where: { deletedAt: null, status: StatusEnum.ACTIVE } }),
      pgsql.tankProcess.count({ where: { status: ProcessStatusEnum.COMPLETED } }),
      pgsql.finding.count({ where: { status: FindingStatusEnum.OPEN, deletedAt: null } }),
      pgsql.finding.count({ where: { status: FindingStatusEnum.OPEN, severity: "CRITICAL", deletedAt: null } }),
      pgsql.inspectionRequest.count({ where: { status: InspectionRequestStatusEnum.SUBMITTED } }),
      pgsql.tankProcess.count({}),
      pgsql.tankProcess.count({ where: { status: ProcessStatusEnum.COMPLETED } }),
    ]);

    const inProgressTanks = await pgsql.tank.count({
      where: {
        deletedAt: null,
        processes: { some: { status: { in: [ProcessStatusEnum.IN_PROGRESS, ProcessStatusEnum.WAITING_REVIEW] } } },
      },
    });

    return {
      tanks: { total: totalTanks, active: activeTanks, inProgress: inProgressTanks },
      processes: { total: totalProcesses, completed: completedProcesses },
      findings: { open: openFindings, critical: criticalFindings },
      inspectionRequests: { pending: pendingRequests },
    };
  }

  static async getTankProgress(): Promise<TankProgressItem[]> {
    const tanks = await pgsql.tank.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        contractorCompany: { select: { id: true, name: true } },
        inspectionCompany: { select: { id: true, name: true } },
        processes: {
          orderBy: { sequenceOrder: "asc" },
          select: {
            id: true,
            name: true,
            type: true,
            sequenceOrder: true,
            status: true,
          },
        },
        _count: { select: { findings: true } },
      },
    });

    return tanks.map((tank) => {
      const total = tank.processes.length;
      const completed = tank.processes.filter((p) => p.status === ProcessStatusEnum.COMPLETED).length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...tank, progress };
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
    const [recentTestRecords, recentRadiography] = await Promise.all([
      pgsql.testRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          tankProcess: {
            include: { tank: { select: { id: true, tankNo: true } } },
          },
          createdByUser: { select: { id: true, name: true } },
        },
      }),
      pgsql.radiographyTest.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          tankProcess: {
            include: { tank: { select: { id: true, tankNo: true } } },
          },
        },
      }),
    ]);

    const [passedTests, failedTests, pendingTests] = await Promise.all([
      pgsql.testRecord.count({ where: { result: "PASSED" } }),
      pgsql.testRecord.count({ where: { result: "FAILED" } }),
      pgsql.testRecord.count({ where: { result: "PENDING" } }),
    ]);

    return {
      testRecords: { passed: passedTests, failed: failedTests, pending: pendingTests, recent: recentTestRecords },
      radiography: { recent: recentRadiography },
    };
  }
}
