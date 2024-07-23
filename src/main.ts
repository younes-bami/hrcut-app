import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { TokenVerificationMiddleware } from './common/middleware/token-verification.middleware';


dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Booking App')
    .setDescription('API documentation for the Booking App')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

    // Use middlewares
    //app.use(new LoggingMiddleware().use);
    //app.use(new TokenVerificationMiddleware().use);

  await app.listen(3000);
}
bootstrap();
