import { pgsql } from "@/lib/database";
import { InspectionRequestTypeEnum } from "generated/prisma";

export class InspectionFormTemplateRepository {
  static async findMany(params: { testType?: InspectionRequestTypeEnum; isActive?: boolean }) {
    return pgsql.inspectionFormTemplate.findMany({
      where: {
        deletedAt: null,
        ...(params.testType && { testType: params.testType }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
      },
      orderBy: [{ testType: "asc" }, { revision: "desc" }],
    });
  }

  static async findById(id: string) {
    return pgsql.inspectionFormTemplate.findFirst({
      where: { id, deletedAt: null },
    });
  }

  // The single active template for a test type. Highest revision wins when
  // multiple revisions are active (revision is a string, seeded numerically).
  static async findActiveByTestType(testType: InspectionRequestTypeEnum) {
    return pgsql.inspectionFormTemplate.findFirst({
      where: { testType, isActive: true, deletedAt: null },
      orderBy: { revision: "desc" },
    });
  }
}
