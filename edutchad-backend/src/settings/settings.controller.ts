// src/settings/settings.controller.ts
import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Req,
} from '@nestjs/common';
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

  // ==================== SÉCURITÉ DU COMPTE ====================

  @Put('password')
  changePassword(@Body() dto: { currentPassword: string; newPassword: string }, @Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();

    if (!dto.currentPassword || !dto.newPassword) {
      throw new BadRequestException('Mot de passe actuel et nouveau mot de passe requis');
    }
    if (dto.newPassword.length < 8) {
      throw new BadRequestException('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }

    return this.service.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }

  // ==================== GESTION DES ADMINISTRATEURS ====================

  @Get('admins')
  listAdmins(@Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.service.listAdmins();
  }

  @Post('admins')
  createAdmin(@Body() dto: { email: string; temporaryPassword: string }, @Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();

    if (!dto.email || !dto.temporaryPassword) {
      throw new BadRequestException('Email et mot de passe temporaire requis');
    }
    if (dto.temporaryPassword.length < 8) {
      throw new BadRequestException('Le mot de passe temporaire doit contenir au moins 8 caractères');
    }

    return this.service.createAdmin(dto.email, dto.temporaryPassword);
  }
}