import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { VehiclesService } from './vehicles.service';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('admin/vehicles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminVehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(
    @Query('plate') plate?: string,
    @Query('brand') brand?: string,
    @Query('model') model?: string,
    @Query('year') year?: string,
    @Query('shopId') shopId?: string,
    @Query('package') vehiclePackage?: string,
    @Query('ownerId') ownerId?: string,
    @Query('includeHistory') includeHistory?: string,
  ) {
    return this.vehiclesService.findAllAdmin({
      plate,
      brand,
      model,
      year: year ? Number(year) : undefined,
      shopId,
      package: vehiclePackage,
      ownerId,
      includeHistory: includeHistory === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOneAdmin(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body('userId') userId?: string) {
    return this.vehiclesService.remove(id, userId || 'admin');
  }

  @Get(':id/activity')
  activity(@Param('id') id: string) {
    return this.vehiclesService.timeline(id, { limit: 100 });
  }
}
