import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { CompanyController as ctrl } from "@/modules/companies/company.controller";

const companies = new Hono();

companies.post("/", protect, requirePermission(PERMISSIONS.COMPANY_CREATE), ctrl.createCompany);
companies.get("/", protect, requirePermission(PERMISSIONS.COMPANY_READ), ctrl.listCompanies);
companies.get("/:id", protect, requirePermission(PERMISSIONS.COMPANY_READ), ctrl.getCompanyById);
companies.patch("/:id", protect, requirePermission(PERMISSIONS.COMPANY_UPDATE), ctrl.updateCompany);
companies.delete("/:id", protect, requirePermission(PERMISSIONS.COMPANY_DELETE), ctrl.deleteCompany);

export default companies;
