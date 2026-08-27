// src/settings/school-public.controller.ts
import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';

// Contrôleur volontairement séparé de SettingsController : pas de
// @UseGuards(JwtAuthGuard) ici, et pas de vérification de rôle — cette
// route est accessible à tous (page de login, sidebars de tous les rôles),
// et ne renvoie que des infos non sensibles (nom + logo de l'école).
@Controller('school-settings')
export class SchoolPublicController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  getPublic() {
    return this.service.getPublicInfo();
  }
}