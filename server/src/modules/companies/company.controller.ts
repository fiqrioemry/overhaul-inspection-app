import { Context } from "hono";
import { responseCreated, responseOK } from "@/utils/response";
import { CompanyService } from "@/modules/companies/company.service";
import { createCompanyRequest, updateCompanyRequest, listCompaniesQuery } from "@/modules/companies/company.schema";

export class CompanyController {
  static async createCompany(c: Context) {
    const request = createCompanyRequest.parse(await c.req.json());
    const company = await CompanyService.createCompany(request);
    return responseCreated(c, "Company created successfully", company);
  }

  static async listCompanies(c: Context) {
    const query = listCompaniesQuery.parse(c.req.query());
    const result = await CompanyService.listCompanies(query);
    return responseOK(c, "Companies retrieved successfully", result.data, result.meta);
  }

  static async getCompanyById(c: Context) {
    const id = c.req.param("id");
    const company = await CompanyService.getCompanyById(id);
    return responseOK(c, "Company retrieved successfully", company);
  }

  static async updateCompany(c: Context) {
    const id = c.req.param("id");
    const request = updateCompanyRequest.parse(await c.req.json());
    const company = await CompanyService.updateCompany(id, request);
    return responseOK(c, "Company updated successfully", company);
  }

  static async deleteCompany(c: Context) {
    const id = c.req.param("id");
    await CompanyService.deleteCompany(id);
    return responseOK(c, "Company deleted successfully");
  }
}
