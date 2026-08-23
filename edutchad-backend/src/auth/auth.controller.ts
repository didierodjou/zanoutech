// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';

class LoginDto {
  email!: string;
  password!: string;
}

// Centralise les options des cookies pour éviter les incohérences.
// secure: true exige HTTPS. En local (http://localhost) tu peux mettre
// secure: false temporairement, mais JAMAIS en production.
const isProd = process.env.NODE_ENV === 'production';

const accessTokenCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 8 * 60 * 60 * 1000, // 8 heures en millisecondes
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
  path: '/auth', // limité aux routes /auth/* (refresh, logout)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(
    @Body() signInDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(
      signInDto.email,
      signInDto.password,
    );
    const { accessToken, refreshToken, user: safeUser } =
      await this.authService.login(user);

    res.cookie('access_token', accessToken, accessTokenCookieOptions);
    res.cookie('refresh_token', refreshToken, refreshTokenCookieOptions);

    // On ne renvoie plus le token dans le body : il est dans le cookie,
    // inaccessible en JS. Seules les infos non sensibles repartent au front.
    return { user: safeUser };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    const { accessToken, user } =
      await this.authService.refreshAccessToken(refreshToken);

    res.cookie('access_token', accessToken, accessTokenCookieOptions);

    return { user };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    await this.authService.logout(refreshToken);

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth' });

    return { success: true };
  }


  @HttpCode(HttpStatus.OK)
  @Post('me')
  async me(@Req() req: Request) {
    return { user: (req as any).user };
  }
}