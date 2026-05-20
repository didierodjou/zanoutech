// src/attendances/attendances.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAbsenceDto } from './dto/create-attendance.dto';
import { UpdateAbsenceDto } from 'src/absences/dto/update-absence.dto';

@Controller('admin/attendances')
@UseGuards(JwtAuthGuard)
export class AttendancesController {
  constructor(private readonly service: AttendancesService) {}

  @Get()
  findAll(
    @Query('studentId') studentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('justified') justified?: string,
  ) {
    const filters = {
      studentId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      justified: justified === 'true' ? true : justified === 'false' ? false : undefined,
    };
    return this.service.findAll(filters);
  }

  @Post()
  create(@Body() dto: CreateAbsenceDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAbsenceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}