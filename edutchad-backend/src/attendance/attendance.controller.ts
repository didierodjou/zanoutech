// src/attendance/attendance.controller.ts
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Récupérer les créneaux horaires pour un professeur
  @Get('teacher/:teacherId/slots')
  async getTeacherScheduleSlots(
    @Param('teacherId') teacherId: string,
    @Query('classId') classId: string,
    @Query('subjectId') subjectId: string
  ) {
    return this.attendanceService.getTeacherScheduleSlots(teacherId, classId, subjectId);
  }

  // Récupérer les élèves d'une classe
  @Get('class/:classId/students')
  async getStudentsByClass(@Param('classId') classId: string) {
    return this.attendanceService.getStudentsByClass(classId);
  }

  // Récupérer les présences pour un cours à une date
  @Get('course/:courseId')
  async getAttendanceByCourse(
    @Param('courseId') courseId: string,
    @Query('date') date: string
  ) {
    return this.attendanceService.getAttendanceByCourse(courseId, date);
  }

  // Enregistrer les présences
  @Post('save')
  async saveAttendance(@Body() data: {
    courseId: string;
    date: string;
    attendances: Array<{ studentId: string; status: string }>;
    scheduleSlotId?: string;
  }) {
    return this.attendanceService.saveAttendance(data);
  }

  // Statistiques des présences
  @Get('stats/class/:classId')
  async getAttendanceStats(
    @Param('classId') classId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.attendanceService.getAttendanceStats(classId, startDate, endDate);
  }

  // Historique des présences d'un élève
  @Get('student/:studentId/history')
  async getStudentAttendanceHistory(
    @Param('studentId') studentId: string,
    @Query('subjectId') subjectId?: string
  ) {
    return this.attendanceService.getStudentAttendanceHistory(studentId, subjectId);
  }
}