// prisma/seed.ts

import { PrismaClient, Role, SubjectCategory, Period, BulletinStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Démarrage du seed...");

 
  const adminPasswordHash = await bcrypt.hash("edutchad", 12);

  const adminUser = await prisma.user.upsert({
    where: {
      email_isDeleted: {
        email: "edutchad@gmail.com",
        isDeleted: false,
      },
    },
    update: {},
    create: {
      email: "edutchad@gmail.com",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log("✅ Admin créé :", adminUser.email);

  // ======================================================
  // TEACHER USERS
  // ======================================================
  const teacherPasswordHash = await bcrypt.hash("password_p", 12);

  const teacherUser1 = await prisma.user.upsert({
    where: {
      email_isDeleted: {
        email: "mahamat@gmail.com",
        isDeleted: false,
      },
    },
    update: {},
    create: {
      email: "mahamat@gmail.com",
      passwordHash: teacherPasswordHash,
      role: Role.TEACHER,
      isActive: true,
    },
  });

  const teacherUser2 = await prisma.user.upsert({
    where: {
      email_isDeleted: {
        email: "amina@gmail.com",
        isDeleted: false,
      },
    },
    update: {},
    create: {
      email: "amina@gmail.com",
      passwordHash: teacherPasswordHash,
      role: Role.TEACHER,
      isActive: true,
    },
  });
  console.log("✅ Utilisateurs enseignants créés");

  // ======================================================
  // TEACHER PROFILES
  // ======================================================
  const teacher1 = await prisma.teacher.upsert({
    where: { userId: teacherUser1.id },
    update: {},
    create: {
      userId: teacherUser1.id,
      firstName: "Mahamat",
      lastName: "Idriss",
      phone: "+235 66 00 00 01",
      specialty: "Mathématiques",
    },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: { userId: teacherUser2.id },
    update: {},
    create: {
      userId: teacherUser2.id,
      firstName: "Amina",
      lastName: "Oumar",
      phone: "+235 66 00 00 02",
      specialty: "Français",
    },
  });
  console.log("✅ Profils enseignants créés");

  
  

  // ======================================================
  // GRADES (notes pour les élèves de 3ème A)
  // ======================================================
 
  console.log("✅ Salaires créés");

  console.log("\n🎉 Seed terminé avec succès !\n");
  console.log("📋 Comptes créés :");
  console.log("  👤 Admin    → admin@edutchad.com       / admin123");
  console.log("  👨‍🏫 Prof 1   → prof.mahamat@edutchad.com / teacher123");
  console.log("  👩‍🏫 Prof 2   → prof.amina@edutchad.com  / teacher123");
  console.log("  🧑‍💼 Staff    → secretariat@edutchad.com / staff123");
  console.log("  🧑‍🎓 Élève 1  → etudiant.ali@edutchad.com    / student123");
  console.log("  🧑‍🎓 Élève 2  → etudiant.mariam@edutchad.com / student123");
  console.log("  🧑‍🎓 Élève 3  → etudiant.ibrahim@edutchad.com / student123");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });