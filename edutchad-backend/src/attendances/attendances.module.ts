import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { AttendancesController } from './attendances.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [AttendancesController],
  providers: [AttendancesService],
  imports: [PrismaModule, AuthModule],
})
export class AttendancesModule {}
