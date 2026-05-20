import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@Controller('meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post()
  create(@Body() createMeetingDto: CreateMeetingDto) {
    return this.meetingService.create(createMeetingDto);
  }

  @Get()
  findAll() {
    return this.meetingService.findAll();
  }

  // Récupérer les réunions d'un étudiant par son studentId
  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.meetingService.findByStudentId(studentId);
  }

  // Récupérer les réunions d'un utilisateur par son userId
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.meetingService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMeetingDto: UpdateMeetingDto) {
    return this.meetingService.update(id, updateMeetingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingService.remove(id);
  }

  // Endpoint pour ajouter un participant
  @Post(':id/participants/:userId')
  addParticipant(@Param('id') id: string, @Param('userId') userId: string) {
    return this.meetingService.addParticipant(id, userId);
  }

  // Endpoint pour retirer un participant
  @Delete(':id/participants/:userId')
  removeParticipant(@Param('id') id: string, @Param('userId') userId: string) {
    return this.meetingService.removeParticipant(id, userId);
  }
}