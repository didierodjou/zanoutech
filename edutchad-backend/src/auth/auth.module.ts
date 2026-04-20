import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import 'dotenv/config'; // Pour lire JWT_SECRET

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true, // Le JWT est dispo partout
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' }, // Le token expire après 1 jour
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}