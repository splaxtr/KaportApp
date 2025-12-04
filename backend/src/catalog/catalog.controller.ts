import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { CatalogService } from './catalog.service';
import { CreateCustomBrandDto } from './dto/create-custom-brand.dto';
import { CreateCustomModelDto } from './dto/create-custom-model.dto';
import { CreateCustomYearDto } from './dto/create-custom-year.dto';

@ApiTags('Catalog')
@Controller('catalog')
@UseGuards(AuthGuard('jwt'), RolesGuard, ShopScopeGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // -------- Sync endpoints (admin only) --------
  @Post('sync/brands')
  @Roles('admin')
  syncBrands(@Req() req: Request) {
    const actorId = (req as any)?.user?.sub || (req as any)?.user?.id || 'system';
    return this.catalogService.syncBrands(actorId);
  }

  @Post('sync/models')
  @Roles('admin')
  syncModels(@Req() req: Request) {
    const actorId = (req as any)?.user?.sub || (req as any)?.user?.id || 'system';
    return this.catalogService.syncModels(actorId);
  }

  // -------- Custom create --------
  @Post('custom/brand')
  @Roles('admin', 'owner')
  createCustomBrand(@Body() dto: CreateCustomBrandDto, @Req() req: Request) {
    const actorId = (req as any)?.user?.sub || (req as any)?.user?.id || 'system';
    return this.catalogService.addCustomBrand(dto, actorId);
  }

  @Post('custom/model')
  @Roles('admin', 'owner')
  createCustomModel(@Body() dto: CreateCustomModelDto, @Req() req: Request) {
    const actorId = (req as any)?.user?.sub || (req as any)?.user?.id || 'system';
    return this.catalogService.addCustomModel(dto, actorId);
  }

  @Post('custom/year')
  @Roles('admin', 'owner')
  createCustomYear(@Body() dto: CreateCustomYearDto, @Req() req: Request) {
    const actorId = (req as any)?.user?.sub || (req as any)?.user?.id || 'system';
    return this.catalogService.addCustomYear(dto, actorId);
  }

  // -------- Dropdown feeds --------
  @Get('brands')
  @Roles('admin', 'owner', 'employee')
  listBrands(@Query('shopId') shopId?: string) {
    return this.catalogService.listBrands(shopId);
  }

  @Get('models')
  @Roles('admin', 'owner', 'employee')
  listModels(@Query('brandId') brandId: string, @Query('shopId') shopId?: string) {
    return this.catalogService.listModels(brandId, shopId);
  }

  @Get('years')
  @Roles('admin', 'owner', 'employee')
  listYears(@Query('modelId') modelId: string, @Query('shopId') shopId?: string) {
    return this.catalogService.listYears(modelId, shopId);
  }
}
