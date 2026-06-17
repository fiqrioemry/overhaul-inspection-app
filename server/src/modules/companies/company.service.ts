import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { Prisma } from "generated/prisma";
import { HTTPException } from "hono/http-exception";
import { CompanyRepository } from "@/modules/companies/company.repository";
import { FileService } from "@/modules/files/file.service";
import { FileRepository } from "@/modules/files/file.repository";
import { CompanyOptionsQuery, CreateCompanyRequest, ListCompaniesQuery, UpdateCompanyRequest } from "@/modules/companies/company.schema";
import type { CompanyItem, CompanyListResult, CompanyOption } from "./company.types";

function toLogoUrl(logoFile: { url: string } | null | undefined): string | null {
  return logoFile?.url ?? null;
}

export class CompanyService {
  static async createCompany(c: Context, request: CreateCompanyRequest, logoFile?: File) {
    const existing = await CompanyRepository.findByName(request.name);
    if (existing) {
      throw new HTTPException(409, { message: "Company with this name already exists", cause: "COMPANY_NAME_EXISTS" });
    }

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      let logoFileStorageId: string | undefined;

      if (logoFile) {
        const fileRecord = await FileService.generateFileRecord(logoFile, "COMPANY_LOGO");
        await FileService.uploadFileToStorage(c, fileRecord);
        const saved = await FileService.saveRecordToDatabase(fileRecord, tx);
        logoFileStorageId = saved.id;
      }

      const company = await CompanyRepository.create(request, logoFileStorageId, tx);
      return { ...company, logoUrl: toLogoUrl(company.logoFile) };
    });
  }

  static async getCompanyOptions(query: CompanyOptionsQuery): Promise<CompanyOption[]> {
    const rows = await CompanyRepository.findOptions(query);
    return rows.map((r) => ({ id: r.id, name: r.name, logoUrl: toLogoUrl(r.logoFile) }));
  }

  static async listCompanies(query: ListCompaniesQuery): Promise<CompanyListResult> {
    const { companies, total } = await CompanyRepository.findMany(query);
    const totalPages = total > 0 ? Math.ceil(total / query.limit) : 0;

    const data: CompanyItem[] = companies.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      address: c.address,
      phone: c.phone,
      email: c.email,
      logoUrl: toLogoUrl(c.logoFile),
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
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

  static async getCompanyById(id: string) {
    const company = await CompanyRepository.findById(id);
    if (!company) {
      throw new HTTPException(404, { message: "Company not found", cause: "COMPANY_NOT_FOUND" });
    }
    return { ...company, logoUrl: toLogoUrl(company.logoFile) };
  }

  static async updateCompany(c: Context, id: string, request: UpdateCompanyRequest, logoFile?: File) {
    const company = await CompanyRepository.findById(id);
    if (!company) {
      throw new HTTPException(404, { message: "Company not found", cause: "COMPANY_NOT_FOUND" });
    }
    if (request.name && request.name !== company.name) {
      const existing = await CompanyRepository.findByName(request.name);
      if (existing) {
        throw new HTTPException(409, { message: "Company with this name already exists", cause: "COMPANY_NAME_EXISTS" });
      }
    }

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      let newLogoFileStorageId: string | null | undefined;

      if (logoFile) {
        // Mark old logo file as unused
        if (company.logoFileStorageId) {
          await FileRepository.markFilesAsUnused(tx, [company.logoFileStorageId]);
        }
        const fileRecord = await FileService.generateFileRecord(logoFile, "COMPANY_LOGO");
        await FileService.uploadFileToStorage(c, fileRecord);
        const saved = await FileService.saveRecordToDatabase(fileRecord, tx);
        newLogoFileStorageId = saved.id;
      }

      const updated = await CompanyRepository.update(id, request, newLogoFileStorageId, tx);
      return { ...updated, logoUrl: toLogoUrl(updated.logoFile) };
    });
  }

  static async deleteCompany(id: string) {
    const company = await CompanyRepository.findById(id);
    if (!company) {
      throw new HTTPException(404, { message: "Company not found", cause: "COMPANY_NOT_FOUND" });
    }

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      if (company.logoFileStorageId) {
        await FileRepository.markFilesAsUnused(tx, [company.logoFileStorageId]);
      }
      await CompanyRepository.softDelete(id, tx);
    });
  }
}
