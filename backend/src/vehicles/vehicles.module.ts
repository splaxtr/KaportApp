import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, ShopScopeGuard],
})
export class VehiclesModule {}
