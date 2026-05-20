-- AlterTable
ALTER TABLE "Absence" ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "scheduleSlotId" TEXT;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_scheduleSlotId_fkey" FOREIGN KEY ("scheduleSlotId") REFERENCES "ScheduleSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
