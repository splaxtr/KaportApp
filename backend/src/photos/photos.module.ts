import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [PhotosController],
  providers: [PhotosService, ShopScopeGuard],
})
export class PhotosModule {}
