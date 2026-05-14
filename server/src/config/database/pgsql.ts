import { PrismaClient } from "../../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import dbConfig from "../constant/database";

const adapter = new PrismaPg({
  connectionString: dbConfig.dbUrl,
});

export const pgsql = new PrismaClient({
  adapter,
});
