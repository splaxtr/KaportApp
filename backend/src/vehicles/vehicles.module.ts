import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { VehicleCatalogService } from './vehicle-catalog.service';
import { VehicleCatalogController } from './vehicle-catalog.controller';
import { AdminVehiclesController } from './admin-vehicles.controller';

@Module({
  imports: [ActivitiesModule, PrismaModule],
  controllers: [VehiclesController, VehicleCatalogController, AdminVehiclesController],
  providers: [VehiclesService, VehicleCatalogService, ShopScopeGuard],
})
export class VehiclesModule {}
