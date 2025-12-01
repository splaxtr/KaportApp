import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';

@Module({
  imports: [PrismaModule],
  controllers: [ShopsController],
  providers: [ShopsService, ShopScopeGuard],
})
export class ShopsModule {}
