import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Toutes les routes de l'API commencent par /api (contrat OpenAPI).
  app.setGlobalPrefix('api');

  // Validation des DTO : rejette les champs inconnus et convertit les types.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // En développement le front passe par le proxy Vite ; CORS ne sert que si
  // le front est servi depuis une autre origine (ex. build Docker).
  app.enableCors({ origin: config.get<string>('FRONTEND_URL') });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DataShare API')
    .setDescription('API de transfert de fichiers par lien temporaire')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  app.enableShutdownHooks();
  await app.listen(config.get<number>('PORT', 3000));
}
void bootstrap();
