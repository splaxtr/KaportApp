import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { PartsController } from './parts.controller';
import { PartsService } from './parts.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [PartsController],
  providers: [PartsService, ShopScopeGuard],
})
export class PartsModule {}
