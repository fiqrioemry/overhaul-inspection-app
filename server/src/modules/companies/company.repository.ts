import { Prisma } from "generated/prisma";
import { pgsql as database } from "@/lib/database";
import { CreateCompanyRequest, ListCompaniesQuery, UpdateCompanyRequest } from "@/modules/companies/company.schema";

const companySelect = {
  id: true,
  name: true,
  type: true,
  address: true,
  phone: true,
  email: true,
  logoUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class CompanyRepository {
  static async create(data: CreateCompanyRequest) {
    return database.company.create({
      data: {
        name: data.name,
        type: data.type,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email || null,
        logoUrl: data.logoUrl || null,
        isActive: data.isActive,
      },
      select: companySelect,
    });
  }

  static async findById(id: string) {
    return database.company.findUnique({
      where: { id, deletedAt: null },
      select: companySelect,
    });
  }

  static async findByName(name: string) {
    return database.company.findFirst({
      where: { name, deletedAt: null },
      select: { id: true },
    });
  }

  static async findMany(query: ListCompaniesQuery) {
    const { page, limit, search, type, isActive, orderBy, sortBy } = query;

    const where: Prisma.CompanyWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(type && { type }),
      ...(isActive !== undefined && { isActive }),
    };

    const [companies, total] = await Promise.all([
      database.company.findMany({
        where,
        select: companySelect,
        orderBy: { [orderBy]: sortBy },
        skip: (page - 1) * limit,
        take: limit,
      }),
      database.company.count({ where }),
    ]);

    return { companies, total };
  }

  static async update(id: string, data: UpdateCompanyRequest) {
    return database.company.update({
      where: { id, deletedAt: null },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: companySelect,
    });
  }

  static async softDelete(id: string) {
    return database.company.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
