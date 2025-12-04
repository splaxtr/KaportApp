import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminVehicleCasesController } from './admin-vehicle-cases.controller';
import { VehicleCasesController } from './vehicle-cases.controller';
import { VehicleCasesService } from './vehicle-cases.service';

@Module({
  imports: [PrismaModule, ActivitiesModule],
  controllers: [VehicleCasesController, AdminVehicleCasesController],
  providers: [VehicleCasesService],
  exports: [VehicleCasesService],
})
export class VehicleCasesModule {}
