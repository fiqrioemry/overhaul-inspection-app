import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { TankController as ctrl } from "@/modules/tanks/tank.controller";
import { TankProcessController as processCtrl } from "@/modules/tank-processes/tank-process.controller";

const tanks = new Hono();

tanks.post("/ai/extract", protect, requirePermission(PERMISSIONS.TANK_CREATE), ctrl.extractDocument);
tanks.post("/", protect, requirePermission(PERMISSIONS.TANK_CREATE), ctrl.createTank);
tanks.get("/", protect, requirePermission(PERMISSIONS.TANK_READ), ctrl.listTanks);
tanks.get("/:id", protect, requirePermission(PERMISSIONS.TANK_READ), ctrl.getTankById);
tanks.patch("/:id", protect, requirePermission(PERMISSIONS.TANK_UPDATE), ctrl.updateTank);
tanks.delete("/:id", protect, requirePermission(PERMISSIONS.TANK_DELETE), ctrl.deleteTank);

tanks.get("/:id/processes", protect, requirePermission(PERMISSIONS.PROCESS_READ), ctrl.getTankProcesses);
// Manual status correction from the tank's Processes tab. Constrained to the status field and
// reuses the same PROCESS_UPDATE policy as the workflow transition and "Mark as Completed"
// actions it sits beside — see tank-process.service.ts#correctStatusManually.
tanks.patch("/:id/processes/:processId/status", protect, requirePermission(PERMISSIONS.PROCESS_UPDATE), processCtrl.correctStatus);

export default tanks;
