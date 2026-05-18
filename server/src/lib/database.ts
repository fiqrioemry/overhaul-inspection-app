import { PrismaPg } from "@prisma/adapter-pg";
import { databaseConfig } from "@/config/env";
import { PrismaClient } from "@/../generated/prisma";

const adapter = new PrismaPg({
  connectionString: databaseConfig.DB_URL,
});

export const pgsql = new PrismaClient({
  adapter,
});
