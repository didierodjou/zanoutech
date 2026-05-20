// src/auth/jwt-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service'; // ✅ On réutilise AuthService — pas de nouvelle dépendance

/**
 * Guard JWT — délègue la vérification à AuthService.verifyToken()
 * que vous utilisez déjà partout dans le projet.
 *
 * Usage : @UseGuards(JwtAuthGuard) sur un contrôleur ou une route.
 * Le payload { email, sub, role } est ensuite dispo via req.user.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token JWT manquant');
    }

    // AuthService.verifyToken() lance déjà UnauthorizedException si invalide/expiré
    const payload = await this.authService.verifyToken(token);
    (request as any).user = payload;
    return true;
  }

  private extractToken(request: Request): string | null {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' && token ? token : null;
  }
}