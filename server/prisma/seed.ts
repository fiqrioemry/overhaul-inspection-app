import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { RoleEnum, StatusEnum, CompanyType } from "../generated/prisma";
import { hashPassword } from "../src/utils/hash";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Password123@";

const users = [
  {
    email: "superadmin@overhaul.com",
    name: "Super Administrator",
    role: RoleEnum.SUPER_ADMIN,
  },
  {
    email: "admin@overhaul.com",
    name: "System Administrator",
    role: RoleEnum.ADMIN,
  },
  {
    email: "inspector@overhaul.com",
    name: "Ahmad Fiqri Oemry",
    role: RoleEnum.INSPECTOR,
  },
  {
    email: "user@overhaul.com",
    name: "Pertamina SSIE User",
    role: RoleEnum.USER,
  },
];

const companies = [
  {
    name: "PT Pertamina Patra Niaga",
    type: CompanyType.OWNER,
    address: "Jl. Kramat Raya No. 59, Jakarta Pusat",
    phone: "+62-21-31937000",
    email: "info@pertaminapatraniaga.com",
  },
  {
    name: "PT Biro Klasifikasi Indonesia",
    type: CompanyType.INSPECTOR_COMPANY,
    address: "Jl. Yos Sudarso No. 38-40, Jakarta Utara",
    phone: "+62-21-4301017",
    email: "info@bki.co.id",
  },
  {
    name: "PT Jasa Karya Teknik",
    type: CompanyType.CONTRACTOR,
    address: "Jl. Industri Raya No. 12, Tangerang",
    phone: "+62-21-5501234",
    email: "info@jasakarya.co.id",
  },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  console.log("👤 Seeding users...");
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name, role: userData.role },
      create: {
        email: userData.email,
        name: userData.name,
        passwordHash,
        role: userData.role,
        status: StatusEnum.ACTIVE,
        verifiedAt: new Date(),
      },
    });
    console.log(`  ✅ ${user.role}: ${user.name} (${user.email})`);
  }

  console.log("\n🏢 Seeding companies...");
  for (const companyData of companies) {
    const existing = await prisma.company.findFirst({ where: { name: companyData.name } });
    const company = existing ? await prisma.company.update({ where: { id: existing.id }, data: { name: companyData.name } }) : await prisma.company.create({ data: companyData });
    console.log(`  ✅ ${company.type}: ${company.name}`);
  }

  console.log("\n✨ Seeding complete.");
  console.log(`\n📌 Default password for all users: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
