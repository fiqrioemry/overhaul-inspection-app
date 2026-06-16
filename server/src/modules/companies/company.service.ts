import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { Prisma } from "generated/prisma";
import { HTTPException } from "hono/http-exception";
import { CompanyRepository } from "@/modules/companies/company.repository";
import { FileService } from "@/modules/files/file.service";
import { FileRepository } from "@/modules/files/file.repository";
import { CompanyOptionsQuery, CreateCompanyRequest, ListCompaniesQuery, UpdateCompanyRequest } from "@/modules/companies/company.schema";

export class CompanyService {
  static async createCompany(c: Context, request: CreateCompanyRequest, logoFile?: File) {
    const existing = await CompanyRepository.findByName(request.name);
    if (existing) {
      throw new HTTPException(409, { message: "Company with this name already exists", cause: "COMPANY_NAME_EXISTS" });
    }

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      const company = await CompanyRepository.create(request, undefined, tx);

      if (logoFile) {
        const fileRecord = await FileService.generateFileRecord(logoFile, "COMPANY_LOGO");
        await FileService.uploadFileToStorage(c, fileRecord);
        fileRecord.isUsed = true;
        fileRecord.targetId = company.id;
        await FileService.saveRecordToDatabase(fileRecord, tx);
        return CompanyRepository.update(company.id, {}, fileRecord.url!, tx);
      }

      return company;
    });
  }

  static async getCompanyOptions(query: CompanyOptionsQuery) {
    return CompanyRepository.findOptions(query);
  }

  static async listCompanies(query: ListCompaniesQuery) {
    const { companies, total } = await CompanyRepository.findMany(query);
    return {
      data: companies,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  static async getCompanyById(id: string) {
    const company = await CompanyRepository.findById(id);
    if (!company) {
      throw new HTTPException(404, { message: "Company not found", cause: "COMPANY_NOT_FOUND" });
    }
    return company;
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
      let logoUrl: string | undefined;

      if (logoFile) {
        const existingFile = await FileService.getFileRecordByTargetId(id, "COMPANY_LOGO");
        if (existingFile) {
          await FileRepository.markFilesAsUnused(tx, [existingFile.id]);
        }
        const fileRecord = await FileService.generateFileRecord(logoFile, "COMPANY_LOGO");
        await FileService.uploadFileToStorage(c, fileRecord);
        fileRecord.isUsed = true;
        fileRecord.targetId = id;
        await FileService.saveRecordToDatabase(fileRecord, tx);
        logoUrl = fileRecord.url!;
      }

      return CompanyRepository.update(id, request, logoUrl, tx);
    });
  }

  static async deleteCompany(id: string) {
    const company = await CompanyRepository.findById(id);
    if (!company) {
      throw new HTTPException(404, { message: "Company not found", cause: "COMPANY_NOT_FOUND" });
    }

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      const logoFile = await FileService.getFileRecordByTargetId(id, "COMPANY_LOGO");
      if (logoFile) {
        await FileRepository.markFilesAsUnused(tx, [logoFile.id]);
      }
      await CompanyRepository.softDelete(id, tx);
    });
  }
}
