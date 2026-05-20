/*
  Warnings:

  - You are about to drop the column `mainTeacherId` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `schoolYearId` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Control` table. All the data in the column will be lost.
  - You are about to drop the column `maxScore` on the `Control` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `Control` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Control` table. All the data in the column will be lost.
  - You are about to drop the column `controlId` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `Punishment` table. All the data in the column will be lost.
  - The `category` column on the `Subject` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `MeetingParticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SchoolYear` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Class` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,subjectId,trimester]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mainClassId]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `status` on the `Attendance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `studentId` to the `Control` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trimester` to the `Control` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Control` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trimester` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trimester` to the `Punishment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_mainTeacherId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_schoolYearId_fkey";

-- DropForeignKey
ALTER TABLE "Control" DROP CONSTRAINT "Control_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_controlId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingParticipant" DROP CONSTRAINT "MeetingParticipant_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingParticipant" DROP CONSTRAINT "MeetingParticipant_userId_fkey";

-- DropIndex
DROP INDEX "Class_mainTeacherId_key";

-- DropIndex
DROP INDEX "Class_name_schoolYearId_key";

-- DropIndex
DROP INDEX "Grade_studentId_controlId_key";

-- AlterTable
ALTER TABLE "Absence" ALTER COLUMN "date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "date" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "mainTeacherId",
DROP COLUMN "schoolYearId",
ADD COLUMN     "schoolYear" TEXT;

-- AlterTable
ALTER TABLE "Control" DROP COLUMN "courseId",
DROP COLUMN "maxScore",
DROP COLUMN "period",
DROP COLUMN "title",
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD COLUMN     "trimester" INTEGER NOT NULL,
ADD COLUMN     "value" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Grade" DROP COLUMN "controlId",
DROP COLUMN "createdAt",
ADD COLUMN     "coefficient" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "subjectId" TEXT NOT NULL,
ADD COLUMN     "trimester" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "participants" TEXT[];

-- AlterTable
ALTER TABLE "Punishment" DROP COLUMN "period",
ADD COLUMN     "trimester" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Staff" ALTER COLUMN "hiringDate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "category",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'LITTERAIRE';

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "mainClassId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "MeetingParticipant";

-- DropTable
DROP TABLE "SchoolYear";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- DropEnum
DROP TYPE "SubjectCategory";

-- CreateIndex
CREATE UNIQUE INDEX "Class_name_key" ON "Class"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_studentId_subjectId_trimester_key" ON "Grade"("studentId", "subjectId", "trimester");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_mainClassId_key" ON "Teacher"("mainClassId");

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_mainClassId_fkey" FOREIGN KEY ("mainClassId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
