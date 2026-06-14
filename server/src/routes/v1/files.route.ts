import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { singleFile } from "@/middlewares/file.middleware";
import { limitter } from "@/middlewares/limitter.middleware";
import { fileLimit } from "@/config/constant/file.constant";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { FileController as ctrl } from "@/modules/files/file.controller";

const files = new Hono();

files.post(
  "/upload",
  protect,
  requirePermission(PERMISSIONS.FILE_UPLOAD),
  limitter(fileLimit.SINGLE_FILE),
  singleFile(fileLimit.FILE_OPTIONS, "file"),
  ctrl.upload,
);

files.get("/:id", protect, requirePermission(PERMISSIONS.FILE_READ), ctrl.getById);
files.delete("/:id", protect, requirePermission(PERMISSIONS.FILE_UPLOAD), ctrl.delete);

export default files;
