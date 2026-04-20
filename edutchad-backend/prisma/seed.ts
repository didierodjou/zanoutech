// prisma/seed.ts
import { PrismaClient, Role, Period } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL); // Debug

  const saltRounds = 10;

  // 1. Créer les matières
  const math = await prisma.subject.upsert({
    where: { name: 'Mathématiques' },
    update: {},
    create: {
      name: 'Mathématiques',
      color: '#3498db',
    },
  });

  const francais = await prisma.subject.upsert({
    where: { name: 'Français' },
    update: {},
    create: {
      name: 'Français',
      color: '#2ecc71',
    },
  });

  console.log('✅ Matières créées');

  // 2. Créer les classes
  const classe6A = await prisma.class.upsert({
    where: { name: '6ème A' },
    update: {},
    create: {
      name: '6ème A',
      level: '6ème',
    },
  });

  console.log('✅ Classes créées');

  // 3. Créer les élèves
  const studentPassword = await bcrypt.hash('student123', saltRounds);

  const eleve1 = await prisma.user.upsert({
    where: { email: 'jean.arouko@edutchad.td' },
    update: {},
    create: {
      email: 'jean.arouko@edutchad.td',
      passwordHash: studentPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          firstName: 'Jean',
          lastName: 'Arouko',
          dateOfBirth: new Date('2014-03-15'),
          registrationNo: 'MAT001',
          parentName: 'M. Arouko',
          parentPhone: '+235 99 00 00 10',
          parentEmail: 'parent.arouko@email.com',
          classId: classe6A.id,
        },
      },
    },
    include: {
      studentProfile: true
    }
  });

  console.log('✅ Élève créé');

  // 4. Créer des contrôles
  if (eleve1.studentProfile) {
    await prisma.control.createMany({
      data: [
        {
          type: 'DEVOIR',
          value: 15,
          trimester: 1,
          studentId: eleve1.studentProfile.id,
          subjectId: math.id,
        },
        {
          type: 'INTERROGATION',
          value: 14,
          trimester: 1,
          studentId: eleve1.studentProfile.id,
          subjectId: math.id,
        },
      ],
    });

    // 5. Créer des notes
    await prisma.grade.createMany({
      data: [
        {
          value: 15.0,
          trimester: 1,
          period: Period.TRIMESTRE_1,
          studentId: eleve1.studentProfile.id,
          subjectId: math.id,
          coefficient: 4,
        },
      ],
    });
  }

  console.log('✅ Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });