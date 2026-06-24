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
   * Generate TankProcess rows (and their default checklist results) for a project.
   * Idempotent: templates already present on the project are skipped.
   *
   * - templateIds omitted/empty → generate the full applicable set (steam-coil rule applied).
   * - templateIds provided      → generate exactly the selected active templates (explicit
   *   operator choice; applicability rule is not auto-filtered).
   *
   * All generated processes start as NOT_STARTED — there is no LOCKED gating; dependency
   * checks are enforced later at review/completion via the eligibility service.
   */
  static async generateProcessesForProject(
    tx: Prisma.TransactionClient,
    projectId: string,
    hasSteamCoil: boolean,
    templateIds?: string[],
  ): Promise<number> {
    const templates = await tx.processTemplate.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sequenceOrder: "asc" },
      include: { processCriteria: { include: { criteria: true } } },
    });

    const selectedIds = templateIds && templateIds.length > 0 ? new Set(templateIds) : null;
    const targetTemplates = selectedIds
      ? templates.filter((t) => selectedIds.has(t.id))
      : templates.filter((t) => isApplicable(t.applicabilityRule, hasSteamCoil));

    const existing = await tx.tankProcess.findMany({
      where: { projectId },
      select: { processTemplateId: true },
    });
    const existingTemplateIds = new Set(existing.map((p) => p.processTemplateId));

    let created = 0;
    for (const template of targetTemplates) {
      if (existingTemplateIds.has(template.id)) continue;

      const tankProcess = await tx.tankProcess.create({
        data: {
          projectId,
          processTemplateId: template.id,
          name: template.name,
          type: template.type,
          sequenceOrder: template.sequenceOrder,
          status: ProcessStatusEnum.NOT_STARTED,
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
