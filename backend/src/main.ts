import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { MulterExceptionFilter } from './common/filters/multer-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isDev = process.env.NODE_ENV !== 'production';

  const rawUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  const uploadDir = rawUploadDir.startsWith('~')
    ? path.join(os.homedir(), rawUploadDir.slice(1))
    : rawUploadDir;
  fs.mkdirSync(uploadDir, { recursive: true });
  app.use('/uploads', express.static(uploadDir));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
    new MulterExceptionFilter(),
  );
  const originList = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (isDev) {
    app.use(
      helmet({
        contentSecurityPolicy: false,
      }),
    );
  } else {
    app.use(
      helmet({
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'blob:', ...originList, '*'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", ...originList, '*'],
          },
        },
      }),
    );
  }
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 500,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.enableCors({
    origin: (origin, callback) => {
      const whitelist = originList;
      if (!origin || whitelist.length === 0 || whitelist.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
}

bootstrap();
