// src/dashboard/dashboard.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Activity } from './dashboard.interfaces';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('activities')
  async getRecentActivities(@Query('limit') limit: string = '10'): Promise<Activity[]> {
    // Convertir le paramètre string en nombre
    const limitNumber = parseInt(limit, 10) || 10;
    return this.dashboardService.getRecentActivities(limitNumber);
  }

  @Get('recent-students')
  async getRecentStudents(@Query('limit') limit: string = '5') {
    const limitNumber = parseInt(limit, 10) || 5;
    return this.dashboardService.getRecentStudents(limitNumber);
  }

  @Get('subjects/count')
  async getSubjectsCount() {
    const count = await this.dashboardService.getSubjectsCount?.() || 0;
    return { count };
  }

  @Get('principals/count')
  async getPrincipalsCount() {
    const count = await this.dashboardService.getPrincipalsCount?.() || 0;
    return { count };
  }
// NOUVEAU : Endpoint pour l'évolution des effectifs
  @Get('evolution')
  async getEvolution() {
    return this.dashboardService.getEvolution();
  }

  // NOUVEAU : Endpoint pour la répartition par niveau
  @Get('distribution')
  async getDistribution() {
    return this.dashboardService.getDistribution();
  }

  @Get('salaries/pending/count')
  async getPendingSalariesCount() {
    const count = await this.dashboardService.getPendingSalariesCount?.() || 0;
    return { count };
  }
}