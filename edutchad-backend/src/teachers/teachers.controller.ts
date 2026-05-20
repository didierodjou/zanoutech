// src/teachers/teachers.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UnauthorizedException,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeachersService } from './teachers.service';

@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  // Static routes
  @Get('profile-by-email')
  async getProfileByEmail(@Query('email') email: string) {
    return this.teachersService.findByEmail(email);
  }

  @Get('profile')
  async getProfile(@Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Non authentifié');
    }
    return this.teachersService.getProfile(userId);
  }

  @Get('deleted')
  async findDeleted() {
    return this.teachersService.findDeleted();
  }

  @Get('principals/count')
  async getPrincipalsCount() {
    const count = await this.teachersService.getPrincipalsCount();
    return { count };
  }

  @Get('classes/active')
  async getActiveClasses() {
    return this.teachersService.findAllActiveClasses();
  }

  @Get('class/:classId/students')
  async getStudentsByClassId(@Param('classId') classId: string) {
    return this.teachersService.getStudentsByClassId(classId);
  }

  // Collection routes
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTeacherDto: any) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  async findAll() {
    return this.teachersService.findAll();
  }

  // Dynamic routes
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Get(':id/details')
  async getDetails(@Param('id') id: string) {
    return this.teachersService.getDetails(id);
  }

  @Get(':id/courses')
  async getTeacherCourses(@Param('id') id: string) {
    return this.teachersService.getTeacherCourses(id);
  }

  @Get(':id/main-class')
  async getMainClass(@Param('id') id: string) {
    return this.teachersService.getMainClass(id);
  }

  @Get(':id/class-students')
  async getClassStudents(@Param('id') id: string) {
    return this.teachersService.getClassStudents(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTeacherDto: any) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Put('profile/:id')
  async updateProfile(@Param('id') id: string, @Body() updateProfileDto: any) {
    return this.teachersService.updateProfile(id, updateProfileDto);
  }

  @Put('photo/:id')
  async updatePhoto(@Param('id') id: string, @Body() body: { photoUrl: string }) {
    return this.teachersService.updatePhoto(id, body.photoUrl);
  }

  @Put(':id/assign-main-class')
  async assignMainClass(@Param('id') id: string, @Body() body: { classId: string }) {
    return this.teachersService.assignMainClass(id, body.classId);
  }

  @Put(':id/remove-main-class')
  async removeMainClass(@Param('id') id: string) {
    return this.teachersService.removeMainClass(id);
  }

  @Put(':id/assign-subjects')
  async assignSubjects(@Param('id') id: string, @Body() body: { subjectIds: string[] }) {
    return this.teachersService.assignSubjects(id, body.subjectIds);
  }

  @Put(':id/change-password')
  async changePassword(@Param('id') id: string, @Body() body: { newPassword?: string }) {
    return this.teachersService.changePassword(id, body.newPassword);
  }

  @Put(':id/restore')
  async restore(@Param('id') id: string) {
    return this.teachersService.restore(id);
  }

  @Post(':id/assign-class')
  @HttpCode(HttpStatus.CREATED)
  async assignClass(
    @Param('id') id: string,
    @Body() body: { classId: string; subjectId: string; coefficient?: number },
  ) {
    return this.teachersService.assignClass(id, body);
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    return this.teachersService.resetPassword(id);
  }

  @Delete(':id/soft')
  async softDelete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId;
    return this.teachersService.softDelete(id, userId);
  }

  @Delete(':id/subjects/:subjectId')
  async removeSubject(@Param('id') id: string, @Param('subjectId') subjectId: string) {
    return this.teachersService.removeSubject(id, subjectId);
  }

  @Delete(':id/classes/:classId/subjects/:subjectId')
  async removeClass(
    @Param('id') id: string,
    @Param('classId') classId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.teachersService.removeClass(id, classId, subjectId);
  }

  @Delete(':id/classes')
  async removeAllClasses(@Param('id') id: string) {
    return this.teachersService.removeAllClasses(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return this.teachersService.hardDelete(id);
  }
}