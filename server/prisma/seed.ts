import { pgsql } from "@/lib/database";
import { RoleEnum, StatusEnum } from "../generated/prisma";
import { hashPassword } from "../src/utils/hash"; // no alias, relative path

const PASSWORD = "Password123@";

const users = [
  {
    email: "ahmadfiqrioemry@gmail.com",
    name: "Ahmad Fiqri Oemry",
    role: RoleEnum.INSPECTOR,
  },
  {
    email: "brianadiguna@gmail.com",
    name: "Brian Adiguna",
    role: RoleEnum.INSPECTOR,
  },
  {
    email: "rominuzulian@gmail.com",
    name: "Romi Nuzulian",
    role: RoleEnum.USER,
  },
];

async function main() {
  console.log("🌱 Seeding users...\n");

  const passwordHash = await hashPassword(PASSWORD);

  for (const userData of users) {
    const user = await pgsql.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        passwordHash,
        role: RoleEnum.USER,
        status: StatusEnum.ACTIVE,
        verifiedAt: new Date(),
      },
    });

    console.log(`✅ Created user: ${user.name} (${user.email})`);
  }

  console.log("\n✨ Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pgsql.$disconnect();
  });
