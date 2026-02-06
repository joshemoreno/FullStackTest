import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { flattenErrors } from './common/flattenErrors';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Validation failed',
          errors: flattenErrors(errors),
        }),
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  
  const config = new DocumentBuilder()
    .setTitle('Checkout API')
    .setDescription('Local API for checkout flow')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;

  await app.listen(port, '127.0.0.1');
}

bootstrap();
