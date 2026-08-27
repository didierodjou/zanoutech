// prisma/seed-admin.ts


import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12; // cohérent avec settings.service.ts

// On lit d'abord les variables d'environnement (meilleure pratique), avec
// les valeurs fournies comme repli si elles ne sont pas définies.
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || 'edutchad_m@gmail.com')
  .trim()
  .toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'zanoutech26';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

  const existing = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL, isDeleted: false },
  });

  if (existing) {
    if (existing.role !== Role.ADMIN) {
      console.warn(
        `Un compte existe déjà pour ${ADMIN_EMAIL} mais avec le rôle ${existing.role}, pas ADMIN. Rien n'a été modifié — vérifie manuellement.`,
      );
      return;
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        isActive: true,
        mustChangePassword: true,
      },
    });
    console.log(`Compte admin existant mis à jour : ${ADMIN_EMAIL}`);
    return;
  }

  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      mustChangePassword: true,
    },
  });

  console.log(`Compte admin créé : ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((err) => {
    console.error('❌ Erreur lors du seed admin :', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });