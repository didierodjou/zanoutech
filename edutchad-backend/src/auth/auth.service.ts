// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 1. Valider l'utilisateur (login)
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { email, isDeleted: false },
    });

    if (!user) throw new UnauthorizedException('Email incorrect');
    if (!user.isActive) throw new UnauthorizedException('Compte désactivé');

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Mot de passe incorrect');

    const { passwordHash, ...result } = user;
    return result;
  }

  // 2. Générer le token
  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  // 3. ✅ Vérifier un token JWT — utilisé par JwtAuthGuard
  //    Retourne le payload décodé { email, sub, role, iat, exp }
  //    Lance UnauthorizedException si le token est invalide ou expiré
  async verifyToken(token: string): Promise<{ email: string; sub: string; role: string }> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}