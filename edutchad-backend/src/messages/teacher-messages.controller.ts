import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { Role } from '@prisma/client';

@Controller('teacher/messages')
@UseGuards(JwtAuthGuard)
export class TeacherMessagesController {
  constructor(private readonly service: MessagesService) {}

  private assertTeacher(req: any) {
    if (req.user.role !== Role.TEACHER) throw new ForbiddenException();
  }

  @Get()
  getMessages(@Req() req: any, @Query('type') type: 'sent' | 'received') {
    this.assertTeacher(req);
    if (type === 'sent') return this.service.getSent(req.user.sub);
    return this.service.getReceived(req.user.sub);
  }

  @Post()
  send(@Body() dto: SendMessageDto, @Req() req: any) {
    this.assertTeacher(req);
    return this.service.send(dto, req.user.sub);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: any) {
    this.assertTeacher(req);
    return this.service.markAsRead(id, req.user.sub);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    this.assertTeacher(req);
    return this.service.delete(id, req.user.sub);
  }

  // Annuaire pour choisir un destinataire (parents, admin, autres profs...)
  @Get('contacts')
  getContacts(@Req() req: any) {
    this.assertTeacher(req);
    return this.service.findAllUsers();
  }
}