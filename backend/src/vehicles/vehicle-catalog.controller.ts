import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VehicleCatalogService } from './vehicle-catalog.service';
import { CreateCustomVehicleEntryDto } from './dto/create-custom-vehicle-entry.dto';

@ApiTags('vehicle-catalog')
@Controller('vehicles/catalog')
export class VehicleCatalogController {
  constructor(private readonly service: VehicleCatalogService) {}

  @Get('brands')
  getBrands(@Query('shopId') shopId: string) {
    return this.service.getBrands(shopId);
  }

  @Get('models')
  getModels(@Query('shopId') shopId: string, @Query('brand') brand: string) {
    return this.service.getModels(shopId, brand).catch(() => []);
  }

  @Get('years')
  getYears(
    @Query('shopId') shopId: string,
    @Query('brand') brand: string,
    @Query('model') model: string,
  ) {
    return this.service.getYears(shopId, brand, model).catch(() => []);
  }

  @Get('packages')
  getPackages(
    @Query('shopId') shopId: string,
    @Query('brand') brand: string,
    @Query('model') model: string,
    @Query('year') year?: string,
  ) {
    return this.service.getPackages(shopId, brand, model, year ? Number(year) : undefined).catch(() => []);
  }

  @Post('custom')
  createCustom(@Body() dto: CreateCustomVehicleEntryDto) {
    return this.service.createCustomEntry(dto);
  }
}
