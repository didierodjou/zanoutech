// src/schedule/schedule.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  async create(@Body() createScheduleDto: any) {
    return this.scheduleService.create(createScheduleDto);
  }

  @Get()
  async findAll() {
    return this.scheduleService.findAll();
  }

  @Get('class/:classId')
  async findByClass(@Param('classId') classId: string) {
    return this.scheduleService.findByClass(classId);
  }

  @Get('teacher/:teacherId')
  async findByTeacher(@Param('teacherId') teacherId: string) {
    return this.scheduleService.findByTeacher(teacherId);
  }

  @Get('day/:day')
  async findByDay(@Param('day') day: number) {
    return this.scheduleService.findByDay(day);
  }

  @Get('room/:room')
  async findByRoom(@Param('room') room: string) {
    return this.scheduleService.findByRoom(room);
  }

  @Get('check-conflict')
  async checkConflict(
    @Query('classId') classId: string,
    @Query('dayOfWeek') dayOfWeek: number,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('room') room: string,
    @Query('excludeId') excludeId?: string
  ) {
    return this.scheduleService.checkConflict(classId, dayOfWeek, startTime, endTime, room, excludeId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateScheduleDto: any) {
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.scheduleService.delete(id);
  }


}