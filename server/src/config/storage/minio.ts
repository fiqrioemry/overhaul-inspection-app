// config/storage/minio.ts
import { Client } from "minio";

export const minioClient = new Client({
  endPoint: process.env.MINIO_HOST!,
  port: Number(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

export const BUCKET = process.env.MINIO_BUCKET!;
