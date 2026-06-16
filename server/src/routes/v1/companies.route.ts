import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { optionalFile } from "@/middlewares/file.middleware";
import { fileLimit } from "@/config/constant/file.constant";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { CompanyController as ctrl } from "@/modules/companies/company.controller";

const companies = new Hono();

companies.post("/", protect, requirePermission(PERMISSIONS.COMPANY_CREATE), optionalFile({ ...fileLimit.AVATAR_OPTIONS, field: "logo" }, "logo"), ctrl.createCompany);
companies.get("/", protect, requirePermission(PERMISSIONS.COMPANY_READ), ctrl.listCompanies);
companies.get("/options", protect, requirePermission(PERMISSIONS.COMPANY_READ), ctrl.getCompanyOptions);
companies.get("/:id", protect, requirePermission(PERMISSIONS.COMPANY_READ), ctrl.getCompanyById);
companies.patch("/:id", protect, requirePermission(PERMISSIONS.COMPANY_UPDATE), optionalFile({ ...fileLimit.AVATAR_OPTIONS, field: "logo" }, "logo"), ctrl.updateCompany);
companies.delete("/:id", protect, requirePermission(PERMISSIONS.COMPANY_DELETE), ctrl.deleteCompany);

export default companies;
