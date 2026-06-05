import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Wire Pino to handle NestJS core logs
  app.useLogger(app.get(Logger));

  // Configure Swagger Document Builder
  const config = new DocumentBuilder()
    .setTitle('EssaiAI API')
    .setDescription('Stateless, privacy-first AI essay review engine API documentation.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Enable CORS for universal frontend requests
  app.enableCors({
    origin: process.env.CLIENT_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Wire Global Input Validations
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
