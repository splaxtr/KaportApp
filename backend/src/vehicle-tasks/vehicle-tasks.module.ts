import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminVehicleTasksController } from './admin-vehicle-tasks.controller';
import { VehicleTasksController } from './vehicle-tasks.controller';
import { VehicleTasksService } from './vehicle-tasks.service';

@Module({
  imports: [PrismaModule, ActivitiesModule],
  controllers: [VehicleTasksController, AdminVehicleTasksController],
  providers: [VehicleTasksService],
  exports: [VehicleTasksService],
})
export class VehicleTasksModule {}
