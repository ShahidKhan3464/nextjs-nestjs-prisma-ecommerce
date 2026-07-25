import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { SWAGGER_EXTRA_MODELS } from './swagger-extra-models';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Sets up Swagger UI at `/api` when enabled.
 * Enablement and document config match the previous inline bootstrap behavior exactly.
 */
export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
  isProduction: boolean,
): void {
  const swaggerEnabled =
    !isProduction ||
    configService.get<string>('SWAGGER_ENABLED') === 'true' ||
    process.env.SWAGGER_ENABLED === 'true';

  if (!swaggerEnabled) {
    return;
  }

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
