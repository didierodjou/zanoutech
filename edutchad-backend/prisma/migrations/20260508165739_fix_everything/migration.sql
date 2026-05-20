/*
  Warnings:

  - You are about to drop the column `schoolYear` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Control` table. All the data in the column will be lost.
  - You are about to drop the column `trimester` on the `Control` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Control` table. All the data in the column will be lost.
  - You are about to drop the column `coefficient` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `trimester` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `participants` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `trimester` on the `Punishment` table. All the data in the column will be lost.
  - The `category` column on the `Subject` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `mainClassId` on the `Teacher` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mainTeacherId]` on the table `Class` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,schoolYearId]` on the table `Class` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,controlId]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `status` on the `Attendance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `schoolYearId` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseId` to the `Control` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period` to the `Control` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Control` table without a default value. This is not possible if the table is not empty.
  - Added the required column `controlId` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period` to the `Punishment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

-- CreateEnum
CREATE TYPE "SubjectCategory" AS ENUM ('LITTERAIRE', 'SCIENTIFIQUE');

-- DropForeignKey
ALTER TABLE "Control" DROP CONSTRAINT "Control_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Teacher" DROP CONSTRAINT "Teacher_mainClassId_fkey";

-- DropIndex
DROP INDEX "Class_name_key";

-- DropIndex
DROP INDEX "Grade_studentId_subjectId_trimester_key";

-- DropIndex
DROP INDEX "Teacher_mainClassId_key";

-- AlterTable
ALTER TABLE "Absence" ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "AttendanceStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "schoolYear",
ADD COLUMN     "mainTeacherId" TEXT,
ADD COLUMN     "schoolYearId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Control" DROP COLUMN "studentId",
DROP COLUMN "trimester",
DROP COLUMN "value",
ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
ADD COLUMN     "period" "Period" NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Grade" DROP COLUMN "coefficient",
DROP COLUMN "subjectId",
DROP COLUMN "trimester",
ADD COLUMN     "controlId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "participants";

-- AlterTable
ALTER TABLE "Punishment" DROP COLUMN "trimester",
ADD COLUMN     "period" "Period" NOT NULL;

-- AlterTable
ALTER TABLE "Staff" ALTER COLUMN "hiringDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "category",
ADD COLUMN     "category" "SubjectCategory" NOT NULL DEFAULT 'LITTERAIRE';

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "mainClassId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "SchoolYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SchoolYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolYear_name_key" ON "SchoolYear"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingParticipant_meetingId_userId_key" ON "MeetingParticipant"("meetingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_mainTeacherId_key" ON "Class"("mainTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_name_schoolYearId_key" ON "Class"("name", "schoolYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_studentId_controlId_key" ON "Grade"("studentId", "controlId");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_mainTeacherId_fkey" FOREIGN KEY ("mainTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
