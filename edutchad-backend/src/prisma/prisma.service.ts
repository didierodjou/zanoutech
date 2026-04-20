import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config'; // Charge le .env

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // 1. On récupère l'URL du fichier .env
    const connectionString = process.env.DATABASE_URL;
    
    // 2. Création du Pool PostgreSQL
    const pool = new Pool({ 
      connectionString: connectionString 
    });
    
    // 3. Initialisation de l'adaptateur Prisma
    const adapter = new PrismaPg(pool);

    // 4. Appel du parent avec l'adaptateur
    super({ 
      adapter,
      log: ['query', 'error', 'warn'] 
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}