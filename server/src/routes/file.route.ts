import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { singleFile } from "@/middlewares/file.middleware";
import { limitter } from "@/middlewares/limitter.middleware";
import { fileLimit } from "@/config/constant/file.constant";
import { FileController as ctrl } from "@/controllers/file.controller";

const file = new Hono();

file.post("/upload/:module", protect, limitter(fileLimit.SINGLE_FILE), singleFile(fileLimit.FILE_OPTIONS, "file"), ctrl.singleUpload);
file.delete("/:fileId", protect, ctrl.delete);

export default file;
