import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';
import { AdminShopsController } from './admin-shops.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ShopsController, AdminShopsController],
  providers: [ShopsService, ShopScopeGuard],
})
export class ShopsModule {}
