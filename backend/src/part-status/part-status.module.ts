import { Module } from '@nestjs/common';
import { PartStatusController } from './part-status.controller';
import { PartStatusService } from './part-status.service';

@Module({
  controllers: [PartStatusController],
  providers: [PartStatusService],
})
export class PartStatusModule {}
