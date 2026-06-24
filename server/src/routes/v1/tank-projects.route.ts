import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { TankProjectController as ctrl } from "@/modules/tank-projects/tank-project.controller";

const tankProjects = new Hono();

tankProjects.post("/", protect, requirePermission(PERMISSIONS.TANK_PROJECT_CREATE), ctrl.createProject);
tankProjects.get("/", protect, requirePermission(PERMISSIONS.TANK_PROJECT_READ), ctrl.listProjects);
tankProjects.get("/:id", protect, requirePermission(PERMISSIONS.TANK_PROJECT_READ), ctrl.getProjectById);
tankProjects.get("/:id/processes", protect, requirePermission(PERMISSIONS.PROCESS_READ), ctrl.getProjectProcesses);
tankProjects.get("/:id/progress-summary", protect, requirePermission(PERMISSIONS.TANK_PROJECT_READ), ctrl.getProgressSummary);
tankProjects.post("/:id/generate-processes", protect, requirePermission(PERMISSIONS.TANK_PROJECT_UPDATE), ctrl.generateProcesses);
tankProjects.patch("/:id", protect, requirePermission(PERMISSIONS.TANK_PROJECT_UPDATE), ctrl.updateProject);
tankProjects.delete("/:id", protect, requirePermission(PERMISSIONS.TANK_PROJECT_DELETE), ctrl.deleteProject);

export default tankProjects;
