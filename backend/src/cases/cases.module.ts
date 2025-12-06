import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { AdminCasesController } from './admin-cases.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';

@Module({
  providers: [CasesService, PrismaService, ActivitiesService],
  controllers: [CasesController, AdminCasesController],
  exports: [CasesService],
})
export class CasesModule {}
