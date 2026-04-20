// prisma.config.ts
import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

// Charger les variables d'environnement
config()

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts', // ← AJOUTER CETTE LIGNE
  },
})