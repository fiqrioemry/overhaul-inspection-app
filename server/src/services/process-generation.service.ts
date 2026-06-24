import { Prisma, ProcessStatusEnum, ChecklistStatusEnum } from "generated/prisma";

/**
 * Resolve whether a process template applies to a given tank.
 * Currently the only rule is STEAM_COIL (optional steam-coil hydrotest).
 */
function isApplicable(applicabilityRule: string | null, hasSteamCoil: boolean): boolean {
  if (!applicabilityRule) return true;
  if (applicabilityRule === "STEAM_COIL") return hasSteamCoil;
  return true;
}

export class ProcessGenerationService {
  /**
   * Generate TankProcess rows (and their default checklist results) for a project
   * from the active ProcessTemplate set. Idempotent: templates already present on
   * the project are skipped, so it can be safely re-run.
   *
   * Dependency-free processes start as NOT_STARTED; processes that have a required
   * dependency start LOCKED and are unlocked later by the dependency resolver.
   */
  static async generateProcessesForProject(
    tx: Prisma.TransactionClient,
    projectId: string,
    hasSteamCoil: boolean,
  ): Promise<number> {
    const templates = await tx.processTemplate.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sequenceOrder: "asc" },
      include: { processCriteria: { include: { criteria: true } } },
    });

    const applicableTemplates = templates.filter((t) => isApplicable(t.applicabilityRule, hasSteamCoil));

    const existing = await tx.tankProcess.findMany({
      where: { projectId },
      select: { processTemplateId: true },
    });
    const existingTemplateIds = new Set(existing.map((p) => p.processTemplateId));

    const requiredDepTemplateIds = new Set(
      (
        await tx.processDependency.findMany({
          where: { isRequired: true },
          select: { processTemplateId: true },
        })
      ).map((d) => d.processTemplateId),
    );

    let created = 0;
    for (const template of applicableTemplates) {
      if (existingTemplateIds.has(template.id)) continue;

      const hasRequiredDeps = requiredDepTemplateIds.has(template.id);

      const tankProcess = await tx.tankProcess.create({
        data: {
          projectId,
          processTemplateId: template.id,
          name: template.name,
          type: template.type,
          sequenceOrder: template.sequenceOrder,
          status: hasRequiredDeps ? ProcessStatusEnum.LOCKED : ProcessStatusEnum.NOT_STARTED,
        },
      });

      if (template.processCriteria.length > 0) {
        await tx.checklistResult.createMany({
          data: template.processCriteria.map((pc) => ({
            tankProcessId: tankProcess.id,
            criteriaId: pc.criteriaId,
            status: ChecklistStatusEnum.NOT_CHECKED,
          })),
          skipDuplicates: true,
        });
      }
      created++;
    }

    return created;
  }
}
