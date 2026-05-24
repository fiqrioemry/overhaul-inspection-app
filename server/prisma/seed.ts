import { pgsql } from "@/lib/database";
import { RoleEnum, StatusEnum, GenderEnum } from "../generated/prisma";
import { hashPassword } from "../src/utils/hash"; // no alias, relative path

const PASSWORD = "Password123@";

const users = [
  {
    email: "farhan.ramadhan@gmail.com",
    name: "Farhan Ramadhan",
    username: "farhanrama",
    bio: "Software engineer by day, coffee addict by night ☕",
    gender: GenderEnum.MALE,
    isPublic: true,
  },
  {
    email: "siti.nuraini@gmail.com",
    name: "Siti Nuraini",
    username: "sitinuraini",
    bio: "UI/UX designer. Making the web a prettier place 🎨",
    gender: GenderEnum.FEMALE,
    isPublic: true,
  },
  {
    email: "budi.santoso@gmail.com",
    name: "Budi Santoso",
    username: "budisantoso",
    bio: "Fullstack dev | Open source enthusiast 🚀",
    gender: GenderEnum.MALE,
    isPublic: false,
  },
  {
    email: "dewi.kartika@gmail.com",
    name: "Dewi Kartika",
    username: "dewikartika",
    bio: "Content creator & digital marketer 📱",
    gender: GenderEnum.FEMALE,
    isPublic: true,
  },
  {
    email: "rizky.pratama@gmail.com",
    name: "Rizky Pratama",
    username: "rizkypratama",
    bio: "Mobile dev | Flutter & React Native | Jakarta 🇮🇩",
    gender: GenderEnum.MALE,
    isPublic: true,
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
        username: userData.username,
        bio: userData.bio,
        gender: userData.gender,
        isPublic: userData.isPublic,
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
