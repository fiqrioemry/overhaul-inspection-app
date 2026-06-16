import { Context } from "hono";
import { responseCreated, responseOK } from "@/utils/response";
import { CompanyService } from "@/modules/companies/company.service";
import { companyOptionsQuery, createCompanyRequest, updateCompanyRequest, listCompaniesQuery } from "@/modules/companies/company.schema";
import { companySuccessMessage } from "@/config/constant/company.constant";

export class CompanyController {
  static async createCompany(c: Context) {
    const logoFile = c.get("logo") as File | undefined;
    const body = await c.req.parseBody({ all: true });
    const request = createCompanyRequest.parse({
      name: body["name"] || undefined,
      type: body["type"] || undefined,
      address: body["address"] || undefined,
      phone: body["phone"] || undefined,
      email: body["email"] || undefined,
      isActive: body["isActive"] ?? undefined,
    });
    const company = await CompanyService.createCompany(c, request, logoFile);
    return responseCreated(c, companySuccessMessage.CREATE_COMPANY, company);
  }

  static async getCompanyOptions(c: Context) {
    const query = companyOptionsQuery.parse(c.req.query());
    const options = await CompanyService.getCompanyOptions(query);
    return responseOK(c, companySuccessMessage.GET_COMPANY_OPTIONS, options);
  }

  static async listCompanies(c: Context) {
    const query = listCompaniesQuery.parse(c.req.query());
    const result = await CompanyService.listCompanies(query);
    return responseOK(c, companySuccessMessage.GET_COMPANIES, result.data, result.meta);
  }

  static async getCompanyById(c: Context) {
    const id = c.req.param("id");
    const company = await CompanyService.getCompanyById(id);
    return responseOK(c, companySuccessMessage.GET_COMPANY, company);
  }

  static async updateCompany(c: Context) {
    const id = c.req.param("id");
    const logoFile = c.get("logo") as File | undefined;
    const body = await c.req.parseBody({ all: true });
    const request = updateCompanyRequest.parse({
      name: body["name"] || undefined,
      type: body["type"] || undefined,
      address: body["address"] || undefined,
      phone: body["phone"] || undefined,
      email: body["email"] || undefined,
      isActive: body["isActive"] ?? undefined,
    });
    const company = await CompanyService.updateCompany(c, id, request, logoFile);
    return responseOK(c, companySuccessMessage.UPDATE_COMPANY, company);
  }

  static async deleteCompany(c: Context) {
    const id = c.req.param("id");
    await CompanyService.deleteCompany(id);
    return responseOK(c, companySuccessMessage.DELETE_COMPANY);
  }
}
