// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: (() => {
        if (!process.env.JWT_SECRET) {
          throw new Error("JWT_SECRET manquant dans les variables d'environnement");
        }
        return process.env.JWT_SECRET;
      })(),
      signOptions: { expiresIn: '8h' }, // aligné avec authService.login
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // 1. authentifie, peuple request.user
    { provide: APP_GUARD, useClass: RolesGuard },    // 2. vérifie le rôle si @Roles() présent
  ],
  exports: [AuthService],
})
export class AuthModule {}