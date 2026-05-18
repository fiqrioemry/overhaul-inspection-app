// config/storage/minio.ts
import { Client } from "minio";
import { minioConfig } from "@/config/env";

export const minioClient = new Client({
  endPoint: minioConfig.HOST,
  port: minioConfig.PORT,
  useSSL: minioConfig.USE_SSL,
  accessKey: minioConfig.ACCESS_KEY,
  secretKey: minioConfig.SECRET_KEY,
});

export const BUCKET = minioConfig.BUCKET;
