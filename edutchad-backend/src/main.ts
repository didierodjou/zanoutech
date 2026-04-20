// edutchad-backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. AUTORISER LE FRONTEND (CORS)
  app.enableCors({
    origin: 'http://localhost:3000', // On autorise uniquement votre site Next.js
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. CHANGER LE PORT POUR 3001 (Pour laisser le 3000 au Frontend)
  await app.listen(3001);
  console.log(`🚀 Backend tourne sur : http://localhost:3001`);
}
bootstrap();