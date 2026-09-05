import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './common/swagger/setup-swagger';
import type { Request, Response, NextFunction } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getUploadsRoot } from './integrations/storage/uploads-root';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { PRIVATE_UPLOAD_SUBDIRS } from './modules/files/constants/file.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const nodeEnv =
    configService.get<string>('app.environments') ?? 'development';
  const frontendUrl =
    configService.get<string>('app.frontendUrl') ?? 'http://localhost:3000';
  const isProduction = nodeEnv === 'production';

  // Required behind reverse proxies / load balancers for correct client IPs (throttling).
  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(compression());

  const corsOrigins = frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  });

  // Block private upload subdirs from the public static mount.
  for (const subdir of PRIVATE_UPLOAD_SUBDIRS) {
    app.use(
      `/uploads/${subdir}`,
      (_req: Request, res: Response, _next: NextFunction) => {
        res.status(404).end();
      },
    );
  }

  app.useStaticAssets(getUploadsRoot(), {
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

  setupSwagger(app, configService, isProduction);

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  Logger.log(`API listening on port ${port} (${nodeEnv})`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error('Error starting the application', err);
  process.exit(1);
});
