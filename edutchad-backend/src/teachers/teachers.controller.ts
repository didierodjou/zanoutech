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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';

@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  // Routes de lecture
  @Get('profile-by-email')
  async getProfileByEmail(@Query('email') email: string) {
    return this.teachersService.findByEmail(email);
  }

  @Get('profile')
  async getProfile(@Req() req: any) {
    const userId = req.user?.sub; // ✅ fix
    if (!userId) {
      throw new UnauthorizedException('Non authentifié');
    }
    return this.teachersService.getProfile(userId);
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

  @Get()
  async findAll() {
    return this.teachersService.findAll();
  }

  // ⚠️ Route statique : doit rester déclarée AVANT ':id', sinon 'deleted'
  // est interprété comme un id par la route dynamique juste en dessous.
  @Roles(Role.ADMIN)
  @Get('deleted')
  async findDeleted() {
    return this.teachersService.findDeleted();
  }

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

  // Routes admin
  @Roles(Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTeacherDto: any) {
    return this.teachersService.create(createTeacherDto);
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTeacherDto: any) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Roles(Role.ADMIN)
  @Put(':id/assign-main-class')
  async assignMainClass(@Param('id') id: string, @Body() body: { classId: string }) {
    return this.teachersService.assignMainClass(id, body.classId);
  }

  @Roles(Role.ADMIN)
  @Put(':id/remove-main-class')
  async removeMainClass(@Param('id') id: string) {
    return this.teachersService.removeMainClass(id);
  }

  @Roles(Role.ADMIN)
  @Put(':id/assign-subjects')
  async assignSubjects(@Param('id') id: string, @Body() body: { subjectIds: string[] }) {
    return this.teachersService.assignSubjects(id, body.subjectIds);
  }

  @Roles(Role.ADMIN)
  @Put(':id/change-password')
  async changePassword(@Param('id') id: string, @Body() body: { newPassword?: string }) {
    return this.teachersService.changePassword(id, body.newPassword);
  }

  @Roles(Role.ADMIN)
  @Put(':id/restore')
  async restore(@Param('id') id: string) {
    return this.teachersService.restore(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/assign-class')
  @HttpCode(HttpStatus.CREATED)
  async assignClass(
    @Param('id') id: string,
    @Body() body: { classId: string; subjectId: string; coefficient?: number },
  ) {
    return this.teachersService.assignClass(id, body);
  }

  @Roles(Role.ADMIN)
  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    return this.teachersService.resetPassword(id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/soft')
  async softDelete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub; // ✅ fix ici aussi
    if (!userId) {
      throw new UnauthorizedException('Non authentifié');
    }
    return this.teachersService.softDelete(id, userId);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/subjects/:subjectId')
  async removeSubject(@Param('id') id: string, @Param('subjectId') subjectId: string) {
    return this.teachersService.removeSubject(id, subjectId);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/classes/:classId/subjects/:subjectId')
  async removeClass(
    @Param('id') id: string,
    @Param('classId') classId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.teachersService.removeClass(id, classId, subjectId);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/classes')
  async removeAllClasses(@Param('id') id: string) {
    return this.teachersService.removeAllClasses(id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return this.teachersService.hardDelete(id);
  }
}