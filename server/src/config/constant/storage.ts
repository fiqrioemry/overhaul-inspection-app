const storageConfig = {
  host: process.env.MINIO_HOST || "minio_storage",
  port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
  useSSL: process.env.MINIO_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minio_access_key",
  secretKey: process.env.MINIO_SECRET_KEY || "minio_secret_key",
  bucket: process.env.MINIO_BUCKET || "my-bucket",
  endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
};

export default storageConfig;
