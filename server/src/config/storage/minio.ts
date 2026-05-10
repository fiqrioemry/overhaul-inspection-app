// config/storage/minio.ts
import { Client } from "minio";
import storageConfig from "@/config/constant/storage";

export const minioClient = new Client({
  endPoint: storageConfig.host,
  port: storageConfig.port,
  useSSL: storageConfig.useSSL,
  accessKey: storageConfig.accessKey,
  secretKey: storageConfig.secretKey,
});

export const BUCKET = storageConfig.bucket;
