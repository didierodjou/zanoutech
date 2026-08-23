import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { Role } from '@prisma/client';

@Controller('admin/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Get()
  getMessages(@Req() req: any, @Query('type') type: 'sent' | 'received') {
    if (req.user.role !== Role.ADMIN) throw new ForbiddenException();
    if (type === 'sent') return this.service.getSent(req.user.sub);
    return this.service.getReceived(req.user.sub);
  }

  @Post()
  send(@Body() dto: SendMessageDto, @Req() req: any) {
    if (req.user.role !== Role.ADMIN) throw new ForbiddenException();
    return this.service.send(dto, req.user.sub);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== Role.ADMIN) throw new ForbiddenException();
    return this.service.markAsRead(id, req.user.sub);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== Role.ADMIN) throw new ForbiddenException();
    return this.service.delete(id, req.user.sub);
  }

  @Get('users')
  getUsers(@Req() req: any) {
    if (req.user.role !== Role.ADMIN) throw new ForbiddenException();
    return this.service.findAllUsers();
  }
}