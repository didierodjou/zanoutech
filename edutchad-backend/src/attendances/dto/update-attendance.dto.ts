// src/attendances/dto/update-absence.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAttendanceDto } from 'src/attendance/dto/create-attendance.dto';

export class UpdateAttendanceDto extends PartialType(CreateAttendanceDto) {}