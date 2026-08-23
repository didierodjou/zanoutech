import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('count')
  async getCount(@Req() req: any) {
    const count = await this.service.getCount(req.user.sub);
    return { count };
  }

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.sub);
  }
}