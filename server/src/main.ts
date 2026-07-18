import { join } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SWAGGER_EXTRA_MODELS } from './common/swagger/swagger-extra-models';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const nodeEnv =
    configService.get<string>('app.environments') ?? 'development';
  const frontendUrl =
    configService.get<string>('app.frontendUrl') ?? 'http://localhost:3000';
  const isProduction = nodeEnv === 'production';

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: isProduction ? frontendUrl : true,
    credentials: true,
  });

  // Block private upload subdirs from the public static mount.
  app.use(
    '/uploads/sellers',
    (_req: Request, res: Response, _next: NextFunction) => {
      res.status(404).end();
    },
  );

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerEnabled =
    !isProduction ||
    configService.get<string>('SWAGGER_ENABLED') === 'true' ||
    process.env.SWAGGER_ENABLED === 'true';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setVersion('1.0')
      .setTitle('My API')
      .setDescription('API documentation')
      .addServer('http://localhost:3001')
      .addBearerAuth(
        {
          name: 'JWT',
          in: 'header',
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      extraModels: [...SWAGGER_EXTRA_MODELS],
    });

    SwaggerModule.setup('api', app, document);
  }

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
}

bootstrap().catch((err) => {
  console.error('Error starting the application:', err);
  process.exit(1);
});
