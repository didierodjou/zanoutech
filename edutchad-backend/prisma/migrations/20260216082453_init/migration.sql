/*
  Warnings:

  - You are about to drop the column `mainTeacherId` on the `Class` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mainClassId]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_mainTeacherId_fkey";

-- DropIndex
DROP INDEX "Class_mainTeacherId_key";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "mainTeacherId";

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "mainClassId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_mainClassId_key" ON "Teacher"("mainClassId");

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_mainClassId_fkey" FOREIGN KEY ("mainClassId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
