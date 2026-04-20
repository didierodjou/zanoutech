// src/teachers/teachers.controller.ts
import { 
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, 
  UnauthorizedException, Patch, Query 
} from '@nestjs/common';
import { TeachersService } from './teachers.service';


@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  // Admin : Créer un professeur
  @Post()
  async create(@Body() createTeacherDto: any) {
    return this.teachersService.create(createTeacherDto);
  }

  
  @Get('profile-by-email')
  async getProfileByEmail(@Query('email') email: string) {
    console.log("Backend: Recherche profil pour", email); // Log pour déboguer
    return this.teachersService.findByEmail(email);
  }

  // Admin : Liste tous les professeurs
  @Get()
  async findAll() {
    return this.teachersService.findAll();
  }

  // Professeur : Récupérer son propre profil
  @Get('profile')
  async getProfile(@Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Non authentifié');
    }
    return this.teachersService.getProfile(userId);
  }

  // Récupérer les cours d'un professeur
  @Get(':id/courses')
  async getTeacherCourses(@Param('id') id: string) {
    return this.teachersService.getTeacherCourses(id);
  }

  // Professeur : Récupérer sa classe principale
  @Get(':id/main-class')
  async getMainClass(@Param('id') id: string) {
    return this.teachersService.getMainClass(id);
  }

  // Professeur : Récupérer les élèves de sa classe
  @Get(':id/class-students')
  async getClassStudents(@Param('id') id: string) {
    return this.teachersService.getClassStudents(id);
  }

  // Professeur : Mettre à jour son profil
  @Put('profile/:id')
  async updateProfile(@Param('id') id: string, @Body() updateProfileDto: any) {
    return this.teachersService.updateProfile(id, updateProfileDto);
  }

  // Professeur : Mettre à jour sa photo
  @Put('photo/:id')
  async updatePhoto(@Param('id') id: string, @Body() body: { photoUrl: string }) {
    return this.teachersService.updatePhoto(id, body.photoUrl);
  }

  // Admin : Récupérer un professeur par ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  // Admin : Détails complets
  @Get(':id/details')
  async getDetails(@Param('id') id: string) {
    return this.teachersService.getDetails(id);
  }

  // Admin : Mettre à jour un professeur
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTeacherDto: any) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  // Admin : Assigner classe principale
  @Put(':id/assign-main-class')
  async assignMainClass(
    @Param('id') id: string,
    @Body() body: { classId: string }
  ) {
    return this.teachersService.assignMainClass(id, body.classId);
  }

  // Admin : Retirer classe principale
  @Put(':id/remove-main-class')
  async removeMainClass(@Param('id') id: string) {
    return this.teachersService.removeMainClass(id);
  }

  // Admin : Assigner matières
  @Put(':id/assign-subjects')
  async assignSubjects(
    @Param('id') id: string,
    @Body() body: { subjectIds: string[] }
  ) {
    return this.teachersService.assignSubjects(id, body.subjectIds);
  }

  // Admin : Retirer une matière spécifique
  @Delete(':id/subjects/:subjectId')
  async removeSubject(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string
  ) {
    return this.teachersService.removeSubject(id, subjectId);
  }

  // Admin : Assigner une classe (cours)
  @Post(':id/assign-class')
  async assignClass(
    @Param('id') id: string,
    @Body() body: { classId: string; subjectId: string; coefficient?: number }
  ) {
    return this.teachersService.assignClass(id, body);
  }

  // Admin : Retirer une classe spécifique
  @Delete(':id/classes/:classId/subjects/:subjectId')
  async removeClass(
    @Param('id') id: string,
    @Param('classId') classId: string,
    @Param('subjectId') subjectId: string
  ) {
    return this.teachersService.removeClass(id, classId, subjectId);
  }

  // Admin : Retirer toutes les classes d'un professeur
  @Delete(':id/classes')
  async removeAllClasses(@Param('id') id: string) {
    return this.teachersService.removeAllClasses(id);
  }

  // Admin : Changer le mot de passe (avec envoi d'email)
  @Put(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() body: { newPassword?: string }
  ) {
    return this.teachersService.changePassword(id, body.newPassword);
  }

  // Admin : Réinitialiser le mot de passe (génère un nouveau mot de passe)
  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    return this.teachersService.resetPassword(id);
  }

  // Admin : Supprimer
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.teachersService.delete(id);
  }

  // Admin : Compter les professeurs principaux
  @Get('principals/count')
  async getPrincipalsCount() {
    const count = await this.teachersService.getPrincipalsCount();
    return { count };
  }
   @Get('class/:classId/students')
  async getStudentsByClassId(@Param('classId') classId: string) {
    return this.teachersService.getStudentsByClassId(classId);
  }

}