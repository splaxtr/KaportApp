import { Module } from '@nestjs/common';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ShopScopeGuard],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
