import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { SWAGGER_EXTRA_MODELS } from './swagger-extra-models';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Sets up Swagger UI at `/api` when enabled.
 * Disabled in production regardless of SWAGGER_ENABLED.
 */
export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
  isProduction: boolean,
): void {
  if (isProduction) {
    return;
  }

  const swaggerDisabled =
    configService.get<string>('SWAGGER_ENABLED') === 'false' ||
    process.env.SWAGGER_ENABLED === 'false';

  if (swaggerDisabled) {
    return;
  }

  const config = new DocumentBuilder()
    .setVersion('1.0')
    .setTitle('Multi Vendor E-Commerce API')
    .setDescription(
      'REST API for the multi-vendor e-commerce platform: catalog, carts, checkout, orders, payments, sellers, and stores.',
    )
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
