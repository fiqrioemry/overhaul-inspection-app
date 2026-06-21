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

export default tanks;
