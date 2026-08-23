/*
  Warnings:

  - You are about to drop the column `description` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `isOnline` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `meetingUrl` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `MeetingParticipant` table. All the data in the column will be lost.
  - Changed the type of `type` on the `Meeting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_organizerId_fkey";

-- DropIndex
DROP INDEX "Meeting_date_idx";

-- DropIndex
DROP INDEX "Meeting_organizerId_idx";

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "description",
DROP COLUMN "isOnline",
DROP COLUMN "meetingUrl",
DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MeetingParticipant" DROP COLUMN "status";

-- DropEnum
DROP TYPE "MeetingRSVP";

-- DropEnum
DROP TYPE "MeetingStatus";

-- DropEnum
DROP TYPE "MeetingType";

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
