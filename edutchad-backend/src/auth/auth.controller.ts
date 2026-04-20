import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

// On définit le format des données attendues (DTO)
class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: LoginDto) {
    // 1. Vérifier les identifiants
    const user = await this.authService.validateUser(signInDto.email, signInDto.password);
    
    // 2. Renvoyer le token
    return this.authService.login(user);
  }
}