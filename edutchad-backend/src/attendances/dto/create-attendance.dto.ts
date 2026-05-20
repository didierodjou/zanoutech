// src/attendances/dto/create-absence.dto.ts
export class CreateAbsenceDto {
  studentId: string | undefined;
  date!: Date;
  type?: string;
  reason?: string;
  courseId?: string;
  scheduleSlotId?: string;
  isJustified?: boolean;
}

