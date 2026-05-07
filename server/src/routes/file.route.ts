import { Hono } from "hono";
import { limitter } from "@/middlewares/limitter";
import fileLimiter from "@/config/common/fileLimit";
import { FileController as ctrl } from "@/controllers/file.controller";
import { protect } from "@/middlewares/auth";
import { singleFile } from "@/middlewares/file";

const file = new Hono();

file.post("/upload/:module", protect, limitter(fileLimiter.singleFile), singleFile(fileLimiter.fileOptions), ctrl.singleUpload);
file.post("/upload-multiple/:module", protect, limitter(fileLimiter.multipleFile), ctrl.multiUpload);
file.delete("/:fileId", protect, ctrl.delete);

export default file;
