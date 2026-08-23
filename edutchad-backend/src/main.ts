// edutchad-backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; // <-- ajouter
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // <-- typer ici

  // 0. Désactiver le cache HTTP (ETag)
  //app.set('etag', false);

  // 1. Lire les cookies httpOnly envoyés par le navigateur
  app.use(cookieParser());

  // 2. AUTORISER LE FRONTEND (CORS)
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3001);
  console.log(`Backend tourne sur : http://localhost:3001`);
}
bootstrap();