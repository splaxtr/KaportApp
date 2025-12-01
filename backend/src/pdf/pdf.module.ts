import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';

@Module({
  imports: [PrismaModule, ActivitiesModule],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}
