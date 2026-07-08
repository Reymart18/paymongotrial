import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import dns from 'dns';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  dotenv.config();
  if (typeof dns.setDefaultResultOrder === 'function') {
    // Prefer IPv4 to avoid IPv6 SMTP timeouts in some networks.
    dns.setDefaultResultOrder('ipv4first');
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  });
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
