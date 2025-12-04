import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesModule } from '../activities/activities.module';
import { ShopScopeGuard } from '../guards/shop-scope.guard';

@Module({
  imports: [PrismaModule, HttpModule, ActivitiesModule],
  controllers: [CatalogController],
  providers: [CatalogService, ShopScopeGuard],
  exports: [CatalogService],
})
export class CatalogModule {}
