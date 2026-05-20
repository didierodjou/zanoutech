/*
  Warnings:

  - The values [EXCUSED] on the enum `AttendanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [TRIMESTRE_1,TRIMESTRE_2,TRIMESTRE_3] on the enum `Period` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `reason` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `Bulletin` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `deletedBy` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `SchoolYear` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `Session` table. All the data in the column will be lost.
  - The `sex` column on the `Student` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `firstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemSetting` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId,trimester]` on the table `Bulletin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,subjectId,trimester]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,isDeleted]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trimester` to the `Bulletin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trimester` to the `Control` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trimester` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trimester` to the `Punishment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshToken` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AttendanceStatus_new" AS ENUM ('PRESENT', 'ABSENT', 'LATE');
ALTER TABLE "Attendance" ALTER COLUMN "status" TYPE "AttendanceStatus_new" USING ("status"::text::"AttendanceStatus_new");
ALTER TYPE "AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "public"."AttendanceStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Period_new" AS ENUM ('TRIMESTER_1', 'TRIMESTER_2', 'TRIMESTER_3');
ALTER TABLE "Control" ALTER COLUMN "period" TYPE "Period_new" USING ("period"::text::"Period_new");
ALTER TABLE "Grade" ALTER COLUMN "period" TYPE "Period_new" USING ("period"::text::"Period_new");
ALTER TABLE "Bulletin" ALTER COLUMN "period" TYPE "Period_new" USING ("period"::text::"Period_new");
ALTER TABLE "Punishment" ALTER COLUMN "period" TYPE "Period_new" USING ("period"::text::"Period_new");
ALTER TYPE "Period" RENAME TO "Period_old";
ALTER TYPE "Period_new" RENAME TO "Period";
DROP TYPE "public"."Period_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropIndex
DROP INDEX "Bulletin_studentId_period_key";

-- DropIndex
DROP INDEX "Class_isDeleted_idx";

-- DropIndex
DROP INDEX "Control_title_courseId_key";

-- DropIndex
DROP INDEX "Course_isDeleted_idx";

-- DropIndex
DROP INDEX "Grade_controlId_idx";

-- DropIndex
DROP INDEX "Grade_studentId_controlId_key";

-- DropIndex
DROP INDEX "Session_token_key";

-- DropIndex
DROP INDEX "Staff_isDeleted_idx";

-- DropIndex
DROP INDEX "Student_isDeleted_idx";

-- DropIndex
DROP INDEX "Subject_isDeleted_idx";

-- DropIndex
DROP INDEX "Subject_name_key";

-- DropIndex
DROP INDEX "Teacher_isDeleted_idx";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "reason";

-- AlterTable
ALTER TABLE "Bulletin" DROP COLUMN "isArchived",
ADD COLUMN     "trimester" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Control" ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "trimester" INTEGER NOT NULL,
ADD COLUMN     "value" DOUBLE PRECISION,
ALTER COLUMN "courseId" DROP NOT NULL,
ALTER COLUMN "period" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "deletedAt",
DROP COLUMN "deletedBy",
DROP COLUMN "isArchived",
DROP COLUMN "isDeleted",
ALTER COLUMN "coefficient" SET DEFAULT 1,
ALTER COLUMN "coefficient" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "coefficient" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "subjectId" TEXT NOT NULL,
ADD COLUMN     "trimester" INTEGER NOT NULL,
ALTER COLUMN "period" DROP NOT NULL,
ALTER COLUMN "controlId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Punishment" ADD COLUMN     "trimester" INTEGER NOT NULL,
ALTER COLUMN "givenBy" SET DEFAULT 'SYSTEM',
ALTER COLUMN "period" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SchoolYear" DROP COLUMN "isArchived";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "ipAddress",
DROP COLUMN "token",
DROP COLUMN "userAgent",
ADD COLUMN     "refreshToken" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "sex",
ADD COLUMN     "sex" TEXT;

-- AlterTable
ALTER TABLE "Subject" ALTER COLUMN "coefficient" SET DEFAULT 1,
ALTER COLUMN "coefficient" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "firstName",
DROP COLUMN "lastLoginAt",
DROP COLUMN "lastName",
DROP COLUMN "phone",
DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpiry",
DROP COLUMN "status";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "SystemSetting";

-- DropEnum
DROP TYPE "AccountStatus";

-- DropEnum
DROP TYPE "Gender";

-- CreateTable
CREATE TABLE "SchoolSetting" (
    "id" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "schoolEmail" TEXT,
    "schoolPhone" TEXT,
    "schoolAddress" TEXT,
    "principalName" TEXT,
    "logo" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'FCFA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "isJustified" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT,
    "scheduleSlotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Absence_studentId_idx" ON "Absence"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Bulletin_studentId_trimester_key" ON "Bulletin"("studentId", "trimester");

-- CreateIndex
CREATE INDEX "Control_studentId_idx" ON "Control"("studentId");

-- CreateIndex
CREATE INDEX "Control_trimester_idx" ON "Control"("trimester");

-- CreateIndex
CREATE INDEX "Grade_subjectId_idx" ON "Grade"("subjectId");

-- CreateIndex
CREATE INDEX "Grade_trimester_idx" ON "Grade"("trimester");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_studentId_subjectId_trimester_key" ON "Grade"("studentId", "subjectId", "trimester");

-- CreateIndex
CREATE INDEX "Punishment_trimester_idx" ON "Punishment"("trimester");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_isDeleted_key" ON "Subject"("name", "isDeleted");

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_scheduleSlotId_fkey" FOREIGN KEY ("scheduleSlotId") REFERENCES "ScheduleSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
