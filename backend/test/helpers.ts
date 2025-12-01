import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

export async function createApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  const prisma = app.get(PrismaService);
  return { app, prisma };
}

export async function cleanDatabase(prisma: PrismaService) {
  await prisma.activity.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.part.deleteMany();
  await prisma.partStatus.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();
}

export function ensureDummyFile(): string {
  const dir = path.join(__dirname, 'fixtures');
  const file = path.join(dir, 'dummy.jpg');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, Buffer.from('ffd8ffe000104a464946000101', 'hex')); // minimal jpeg header
  }
  return file;
}
