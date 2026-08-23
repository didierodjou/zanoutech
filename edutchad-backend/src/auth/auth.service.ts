// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 1. Valider l'utilisateur (login)
  // ⚠️ Message générique volontaire : on ne révèle jamais si c'est l'email
  // ou le mot de passe qui est faux (anti énumération de comptes).
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { email, isDeleted: false },
    });

    const GENERIC_ERROR = 'Email ou mot de passe incorrect';

    if (!user) throw new UnauthorizedException(GENERIC_ERROR);
    if (!user.isActive) throw new UnauthorizedException('Compte désactivé');

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException(GENERIC_ERROR);

    const { passwordHash, ...result } = user;
    return result;
  }

  // 2. Générer access token (courte durée) + refresh token (longue durée)
  //    Le refresh token est stocké hashé en DB (table Session) pour pouvoir
  //    être révoqué (déconnexion forcée, changement de mot de passe, etc.)
  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' });
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: refreshTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  // 3. Vérifier un access token JWT — utilisé par JwtAuthGuard
  async verifyToken(token: string): Promise<{ email: string; sub: string; role: string }> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

  // 4. Renouveler l'access token à partir du refresh token (cookie httpOnly)
  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    const refreshTokenHash = this.hashToken(refreshToken);

    const session = await this.prisma.session.findFirst({
      where: { refreshToken: refreshTokenHash },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        // Session expirée : on la supprime (hygiène DB)
        await this.prisma.session.delete({ where: { id: session.id } });
      }
      throw new UnauthorizedException('Session expirée, merci de vous reconnecter');
    }

    if (!session.user.isActive || session.user.isDeleted) {
      throw new UnauthorizedException('Compte désactivé');
    }

    const payload = {
      email: session.user.email,
      sub: session.user.id,
      role: session.user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' });

    return {
      accessToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
    };
  }

  // 5. Déconnexion : on révoque la session correspondant à ce refresh token
  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const refreshTokenHash = this.hashToken(refreshToken);
    await this.prisma.session.deleteMany({
      where: { refreshToken: refreshTokenHash },
    });
  }

  // On ne stocke jamais le refresh token en clair en base, seulement son hash.
  // Comme c'est déjà un secret aléatoire de 64 octets, un simple sha256 suffit
  // (pas besoin de bcrypt ici, contrairement aux mots de passe utilisateurs).
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}