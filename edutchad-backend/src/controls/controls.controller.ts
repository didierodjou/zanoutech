// src/controls/controls.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ControlsService } from './controls.service';

@Controller('controls')
export class ControlsController {
  constructor(private readonly controlsService: ControlsService) {}

  @Post()
  async create(@Body() createControlDto: any) {
    return this.controlsService.create(createControlDto);
  }

  @Get()
  async findAll() {
    return this.controlsService.findAll();
  }

  @Get('student/:studentId')
  async findByStudent(@Param('studentId') studentId: string) {
    return this.controlsService.findByStudent(studentId);
  }

  @Get('subject/:subjectId')
  async findBySubject(@Param('subjectId') subjectId: string) {
    return this.controlsService.findBySubject(subjectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.controlsService.findOne(id);
  }
}