import { Hono } from "hono";
import { limitter } from "@/middlewares/limitter";
import fileLimiter from "@/config/common/fileLimit";
import { FileController as ctrl } from "@/controllers/file.controller";
import { protect } from "@/middlewares/auth";
import { singleFile } from "@/middlewares/file";

const file = new Hono();

file.post("/upload/:module", protect, limitter(fileLimiter.singleFile), singleFile(fileLimiter.fileOptions, "file"), ctrl.singleUpload);
file.delete("/:fileId", protect, ctrl.delete);

export default file;
