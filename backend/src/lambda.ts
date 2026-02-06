import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import serverlessExpress from '@codegenie/serverless-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigureResult } from '@codegenie/serverless-express/src/configure';
import { Callback, Context, Handler } from 'aws-lambda';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cachedServer: (Handler<any, any> & ConfigureResult<any, any>) | ((arg0: any, arg1: any, arg2: any) => any);

const swaggerHtml = readFileSync(join(process.cwd(), 'assets','swagger.html'), 'utf8');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log']});
  app.enableCors({ origin: true });

  const config = new DocumentBuilder()
    .setTitle('Checkout API')
    .setDescription('Serverless API')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.getHttpAdapter().get('/docs-json', (req, res) => {
    res.json(document);
  });

  app.getHttpAdapter().get('/docs', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(swaggerHtml);
  });

  await app.init();
  return serverlessExpress({ app: app.getHttpAdapter().getInstance() });
}

export const handler = async (event: any, context: Context, callback: Callback<any>) => {
  context.callbackWaitsForEmptyEventLoop = false;
  cachedServer = cachedServer ?? (await bootstrap());
  return cachedServer(event, context, callback);
};
