// import "dotenv/config";
// import { defineConfig } from "prisma/config";

// export default defineConfig({
//   schema: "prisma/schema.prisma",
//   migrations: {
//     path: "prisma/migrations",
//   },
//   datasource: {
//     url: process.env["DATABASE_URL"],
//   },
// });

import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

const currentEnv = process.env.ENV ?? "development";

config({
  path: `.env.${currentEnv}`,
});

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "bun run prisma/seed.ts",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});
