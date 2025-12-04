import { Module } from '@nestjs/common';
import { AdminMetricsService } from './admin-metrics.service';
import { AdminMetricsController } from './admin-metrics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AdminMetricsService],
  controllers: [AdminMetricsController],
})
export class AdminMetricsModule {}
