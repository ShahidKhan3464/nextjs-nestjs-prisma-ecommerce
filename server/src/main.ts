import { join } from 'path';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SWAGGER_EXTRA_MODELS } from './common/swagger/swagger-extra-models';

async function bootstrap() {
  // 1️⃣ Create Nest app
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // 2️⃣ Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 3️⃣ Swagger Config
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

  // 4️⃣ Create Swagger document
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [...SWAGGER_EXTRA_MODELS],
  });

  // 5️⃣ Setup Swagger route
  SwaggerModule.setup('api', app, document);

  // 6️⃣ Start server
  await app.listen(3001);
}

bootstrap().catch((err) => {
  console.error('Error starting the application:', err);
  process.exit(1);
});
