import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requireRole } from "@/middlewares/role.middleware";
import { limitter } from "@/middlewares/limitter.middleware";
import { adminLimit } from "@/config/constant/admin.constant";
import { AdminController as ctrl } from "@/modules/admin/admin.controller";

const admin = new Hono();

admin.use(protect, requireRole("ADMIN"));

admin.get("/reports", limitter(adminLimit.GET_REPORTS), ctrl.getReports);
admin.patch("/reports/:reportId", limitter(adminLimit.UPDATE_REPORT), ctrl.updateReport);
admin.get("/users", limitter(adminLimit.GET_USERS), ctrl.getUsers);
admin.patch("/users/:userId/status", limitter(adminLimit.UPDATE_USER_STATUS), ctrl.updateUserStatus);
admin.get("/stats", limitter(adminLimit.GET_STATS), ctrl.getStats);

export default admin;
