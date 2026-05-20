import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';


@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  imports: [AuthModule, PrismaModule],
})
export class SettingsModule {}
