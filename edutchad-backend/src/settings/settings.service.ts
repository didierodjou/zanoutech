// src/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    let settings = await this.prisma.schoolSetting.findFirst();
    if (!settings) {
      settings = await this.prisma.schoolSetting.create({
        data: { schoolName: 'Mon École', currency: 'FCFA' },
      });
    }
    return settings;
  }

  async update(dto: UpdateSettingsDto) {
    const existing = await this.prisma.schoolSetting.findFirst();
    if (!existing) {
      return this.prisma.schoolSetting.create({ data: dto as any });
    }
    return this.prisma.schoolSetting.update({
      where: { id: existing.id },
      data: dto,
    });
  }
}