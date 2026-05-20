// prisma/seed.ts

import { PrismaClient, Role, SubjectCategory, Period, BulletinStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Démarrage du seed...");

  // ======================================================
  // SCHOOL SETTINGS
  // ======================================================
  const schoolSetting = await prisma.schoolSetting.upsert({
    where: { id: "default-school" },
    update: {},
    create: {
      id: "default-school",
      schoolName: "EduTchad",
      schoolEmail: "contact@edutchad.com",
      schoolPhone: "+235 00 00 00 00",
      schoolAddress: "N'Djamena, Tchad",
      principalName: "M. Directeur",
      currency: "FCFA",
    },
  });
  console.log("✅ SchoolSetting créé");

  // ======================================================
  // SCHOOL YEAR
  // ======================================================
  const schoolYear = await prisma.schoolYear.upsert({
    where: { name: "2024-2025" },
    update: {},
    create: {
      name: "2024-2025",
      startDate: new Date("2024-09-01"),
      endDate: new Date("2025-06-30"),
      isActive: true,
    },
  });
  console.log("✅ SchoolYear créé");

  // ======================================================
  // ADMIN USER
  // ======================================================
  const adminPasswordHash = await bcrypt.hash("admin123", 12);

  const adminUser = await prisma.user.upsert({
    where: {
      email_isDeleted: {
        email: "admin@edutchad.com",
        isDeleted: false,
      },
    },
    update: {},
    create: {
      email: "admin@edutchad.com",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log("✅ Admin créé :", adminUser.email);

  // ======================================================
  // TEACHER USERS
  // ======================================================
  const teacherPasswordHash = await bcrypt.hash("teacher123", 12);

  const teacherUser1 = await prisma.user.upsert({
    where: {
      email_isDeleted: {
        email: "prof.mahamat@edutchad.com",
        isDeleted: false,
      },
    },
    update: {},
    create: {
      email: "prof.mahamat@edutchad.com",
      passwordHash: teacherPasswordHash,
      role: Role.TEACHER,
      isActive: true,
    },
  });

  const teacherUser2 = await prisma.user.upsert({
    where: {
      email_isDeleted: {
        email: "prof.amina@edutchad.com",
        isDeleted: false,
      },
    },
    update: {},
    create: {
      email: "prof.amina@edutchad.com",
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
  // STAFF USER
  // ======================================================
  const staffPasswordHash = await bcrypt.hash("staff123", 12);

  const staffUser = await prisma.user.upsert({
    where: {
      email_isDeleted: {
        email: "secretariat@edutchad.com",
        isDeleted: false,
      },
    },
    update: {},
    create: {
      email: "secretariat@edutchad.com",
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
      isActive: true,
    },
  });

  await prisma.staff.upsert({
    where: { userId: staffUser.id },
    update: {},
    create: {
      userId: staffUser.id,
      firstName: "Fatima",
      lastName: "Hassan",
      jobTitle: "Secrétaire",
      department: "Administration",
      phone: "+235 66 00 00 03",
    },
  });
  console.log("✅ Staff créé");

  // ======================================================
  // SUBJECTS
  // ======================================================
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { name_isDeleted: { name: "Mathématiques", isDeleted: false } },
      update: {},
      create: {
        name: "Mathématiques",
        color: "#3B82F6",
        category: SubjectCategory.SCIENTIFIQUE,
        coefficient: 4,
        teachers: { connect: [{ id: teacher1.id }] },
      },
    }),
    prisma.subject.upsert({
      where: { name_isDeleted: { name: "Français", isDeleted: false } },
      update: {},
      create: {
        name: "Français",
        color: "#EF4444",
        category: SubjectCategory.LITTERAIRE,
        coefficient: 4,
        teachers: { connect: [{ id: teacher2.id }] },
      },
    }),
    prisma.subject.upsert({
      where: { name_isDeleted: { name: "Sciences de la Vie et de la Terre", isDeleted: false } },
      update: {},
      create: {
        name: "Sciences de la Vie et de la Terre",
        color: "#10B981",
        category: SubjectCategory.SCIENTIFIQUE,
        coefficient: 3,
      },
    }),
    prisma.subject.upsert({
      where: { name_isDeleted: { name: "Histoire-Géographie", isDeleted: false } },
      update: {},
      create: {
        name: "Histoire-Géographie",
        color: "#F59E0B",
        category: SubjectCategory.LITTERAIRE,
        coefficient: 2,
      },
    }),
    prisma.subject.upsert({
      where: { name_isDeleted: { name: "Physique-Chimie", isDeleted: false } },
      update: {},
      create: {
        name: "Physique-Chimie",
        color: "#8B5CF6",
        category: SubjectCategory.SCIENTIFIQUE,
        coefficient: 3,
      },
    }),
    prisma.subject.upsert({
      where: { name_isDeleted: { name: "Anglais", isDeleted: false } },
      update: {},
      create: {
        name: "Anglais",
        color: "#EC4899",
        category: SubjectCategory.LITTERAIRE,
        coefficient: 2,
      },
    }),
  ]);
  console.log(`✅ ${subjects.length} matières créées`);

  // ======================================================
  // CLASSES
  // ======================================================
  const class3e = await prisma.class.upsert({
    where: { name_schoolYearId: { name: "3ème A", schoolYearId: schoolYear.id } },
    update: {},
    create: {
      name: "3ème A",
      level: "3ème",
      schoolYearId: schoolYear.id,
      mainTeacherId: teacher1.id,
    },
  });

  const class2nde = await prisma.class.upsert({
    where: { name_schoolYearId: { name: "2nde B", schoolYearId: schoolYear.id } },
    update: {},
    create: {
      name: "2nde B",
      level: "2nde",
      schoolYearId: schoolYear.id,
      mainTeacherId: teacher2.id,
    },
  });
  console.log("✅ Classes créées");

  // ======================================================
  // COURSES (Subject + Teacher + Class)
  // ======================================================
  const [mathSubject, frSubject] = subjects;

  const courseMath3e = await prisma.course.upsert({
    where: {
      subjectId_teacherId_classId: {
        subjectId: mathSubject.id,
        teacherId: teacher1.id,
        classId: class3e.id,
      },
    },
    update: {},
    create: {
      subjectId: mathSubject.id,
      teacherId: teacher1.id,
      classId: class3e.id,
      coefficient: 4,
    },
  });

  const courseFr2nde = await prisma.course.upsert({
    where: {
      subjectId_teacherId_classId: {
        subjectId: frSubject.id,
        teacherId: teacher2.id,
        classId: class2nde.id,
      },
    },
    update: {},
    create: {
      subjectId: frSubject.id,
      teacherId: teacher2.id,
      classId: class2nde.id,
      coefficient: 4,
    },
  });
  console.log("✅ Cours créés");

  // ======================================================
  // SCHEDULE SLOTS
  // ======================================================
  await prisma.scheduleSlot.createMany({
    data: [
      {
        dayOfWeek: 1, // Lundi
        startTime: "08:00",
        endTime: "10:00",
        room: "Salle 101",
        courseId: courseMath3e.id,
        classId: class3e.id,
      },
      {
        dayOfWeek: 3, // Mercredi
        startTime: "10:00",
        endTime: "12:00",
        room: "Salle 102",
        courseId: courseFr2nde.id,
        classId: class2nde.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Créneaux horaires créés");

  // ======================================================
  // STUDENT USERS & PROFILES
  // ======================================================
  const studentPasswordHash = await bcrypt.hash("student123", 12);

  const studentsData = [
    {
      email: "etudiant.ali@edutchad.com",
      firstName: "Ali",
      lastName: "Moussa",
      registrationNo: "ETU-2024-001",
      dateOfBirth: new Date("2010-03-15"),
      sex: "M",
      parentName: "Moussa Ibrahim",
      parentPhone: "+235 66 11 22 33",
      classId: class3e.id,
    },
    {
      email: "etudiant.mariam@edutchad.com",
      firstName: "Mariam",
      lastName: "Abderamane",
      registrationNo: "ETU-2024-002",
      dateOfBirth: new Date("2010-07-20"),
      sex: "F",
      parentName: "Abderamane Youssouf",
      parentPhone: "+235 66 44 55 66",
      classId: class3e.id,
    },
    {
      email: "etudiant.ibrahim@edutchad.com",
      firstName: "Ibrahim",
      lastName: "Khalil",
      registrationNo: "ETU-2024-003",
      dateOfBirth: new Date("2009-11-05"),
      sex: "M",
      parentName: "Khalil Adoum",
      parentPhone: "+235 66 77 88 99",
      classId: class2nde.id,
    },
  ];

  for (const studentData of studentsData) {
    const studentUser = await prisma.user.upsert({
      where: {
        email_isDeleted: {
          email: studentData.email,
          isDeleted: false,
        },
      },
      update: {},
      create: {
        email: studentData.email,
        passwordHash: studentPasswordHash,
        role: Role.STUDENT,
        isActive: true,
      },
    });

    await prisma.student.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: {
        userId: studentUser.id,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        registrationNo: studentData.registrationNo,
        dateOfBirth: studentData.dateOfBirth,
        sex: studentData.sex,
        parentName: studentData.parentName,
        parentPhone: studentData.parentPhone,
        classId: studentData.classId,
      },
    });
  }
  console.log(`✅ ${studentsData.length} élèves créés`);

  // ======================================================
  // GRADES (notes pour les élèves de 3ème A)
  // ======================================================
  const students3e = await prisma.student.findMany({
    where: { classId: class3e.id },
  });

  for (const student of students3e) {
    await prisma.grade.upsert({
      where: {
        studentId_subjectId_trimester: {
          studentId: student.id,
          subjectId: mathSubject.id,
          trimester: 1,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        subjectId: mathSubject.id,
        value: Math.round((Math.random() * 10 + 10) * 10) / 10, // Note entre 10 et 20
        coefficient: 4,
        trimester: 1,
        period: Period.TRIMESTER_1,
      },
    });
  }
  console.log("✅ Notes créées");

  // ======================================================
  // BULLETINS
  // ======================================================
  for (const student of students3e) {
    await prisma.bulletin.upsert({
      where: {
        studentId_trimester: {
          studentId: student.id,
          trimester: 1,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        trimester: 1,
        period: Period.TRIMESTER_1,
        status: BulletinStatus.PENDING,
        generalAverage: Math.round((Math.random() * 6 + 12) * 10) / 10,
        appreciation: "Bon trimestre, continuez les efforts.",
        conduiteNote: 16,
      },
    });
  }
  console.log("✅ Bulletins créés");

  // ======================================================
  // SALARIES
  // ======================================================
  await prisma.salary.createMany({
    data: [
      {
        month: new Date("2024-10-01"),
        baseAmount: 350000,
        bonuses: 25000,
        deductions: 15000,
        netAmount: 360000,
        isPaid: true,
        paymentDate: new Date("2024-10-31"),
        teacherId: teacher1.id,
      },
      {
        month: new Date("2024-10-01"),
        baseAmount: 320000,
        bonuses: 20000,
        deductions: 10000,
        netAmount: 330000,
        isPaid: true,
        paymentDate: new Date("2024-10-31"),
        teacherId: teacher2.id,
      },
    ],
    skipDuplicates: true,
  });
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