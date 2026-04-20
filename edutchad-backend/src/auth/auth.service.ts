import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 1. Fonction pour valider l'utilisateur
  async validateUser(email: string, pass: string): Promise<any> {
    // Chercher l'utilisateur par email
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    // Si l'utilisateur n'existe pas
    if (!user) {
      throw new UnauthorizedException('Email incorrect');
    }

    // Vérifier le mot de passe (comparer hash)
    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    // Si tout est bon, on retourne l'user sans le mot de passe
    const { passwordHash, ...result } = user;
    return result;
  }

  // 2. Fonction pour générer le Token (Login)
  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload), // Le "Pass" numérique
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    };
  }
}