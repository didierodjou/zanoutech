/*
  Warnings:

  - You are about to drop the column `comment` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Grade` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,subjectId,trimester]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subjectId` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trimester` to the `Grade` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_courseId_fkey";

-- AlterTable
ALTER TABLE "Grade" DROP COLUMN "comment",
DROP COLUMN "courseId",
DROP COLUMN "date",
DROP COLUMN "type",
ADD COLUMN     "subjectId" TEXT NOT NULL,
ADD COLUMN     "trimester" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Control" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trimester" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "Control_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Grade_studentId_subjectId_trimester_key" ON "Grade"("studentId", "subjectId", "trimester");

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
