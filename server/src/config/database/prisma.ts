import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dbConfig from "../constant/database";

const adapter = new PrismaPg({
  connectionString: dbConfig.dbUrl,
});

export const prisma = new PrismaClient({
  adapter,
});
