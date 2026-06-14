import { HTTPException } from "hono/http-exception";
import { CompanyRepository } from "@/modules/companies/company.repository";
import { CreateCompanyRequest, ListCompaniesQuery, UpdateCompanyRequest } from "@/modules/companies/company.schema";

export class CompanyService {
  static async createCompany(request: CreateCompanyRequest) {
    const existing = await CompanyRepository.findByName(request.name);
    if (existing) {
      throw new HTTPException(409, { message: "Company with this name already exists", cause: "COMPANY_NAME_EXISTS" });
    }
    return CompanyRepository.create(request);
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

  static async updateCompany(id: string, request: UpdateCompanyRequest) {
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
    return CompanyRepository.update(id, request);
  }

  static async deleteCompany(id: string) {
    const company = await CompanyRepository.findById(id);
    if (!company) {
      throw new HTTPException(404, { message: "Company not found", cause: "COMPANY_NOT_FOUND" });
    }
    await CompanyRepository.softDelete(id);
  }
}
