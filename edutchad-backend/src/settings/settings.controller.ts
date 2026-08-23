// src/settings/settings.controller.ts
import { Controller, Get, Put, Body, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateSettingsDto } from './dto/create-setting.dto';


@Controller('admin/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  get(@Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.service.get();
  }

  @Put()
  update(@Body() dto: UpdateSettingsDto, @Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.service.update(dto);
  }
}