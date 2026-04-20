import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';
import { StudentsModule } from './students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { SalariesModule } from './salaries/salaries.module';
import { AbsencesModule } from './absences/absences.module';
import { GradesModule } from './grades/grades.module';
import { ControlsModule } from './controls/controls.module';
import { StaffModule } from './staff/staff.module';
import { ScheduleModule } from './schedule/schedule.module';
import { CoursesModule } from './courses/courses.module';
import { EmailModule } from './email/email.module';
import { BulletinsModule } from './bulletins/bulletins.module';

@Module({
  imports: [PrismaModule, AuthModule, DashboardModule, TeachersModule, ClassesModule, StudentsModule, SubjectsModule, SalariesModule, AbsencesModule, GradesModule, ControlsModule, StaffModule, ScheduleModule, CoursesModule, EmailModule, BulletinsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
