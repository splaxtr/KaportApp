import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
@UseGuards(AuthGuard('jwt'), RolesGuard, ShopScopeGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @Roles('admin', 'owner', 'employee')
  findAll(
    @Query('shopId') shopId?: string,
    @Query('plate') plate?: string,
    @Query('ownerId') ownerId?: string,
    @Query('includeHistory') includeHistory?: string,
  ) {
    return this.vehiclesService.findAllAdmin({
      shopId,
      plate,
      ownerId,
      includeHistory: includeHistory === 'true',
    });
  }

  @Get(':id')
  @Roles('admin', 'owner', 'employee')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Get(':id/timeline')
  @Roles('admin', 'owner', 'employee')
  timeline(
    @Param('id') id: string,
    @Query('type') type?: string,
    @Query('limit') limit = '100',
    @Query('offset') offset = '0',
  ) {
    return this.vehiclesService.timeline(id, {
      type,
      limit: Number(limit) || 100,
      offset: Number(offset) || 0,
    });
  }

  @Post()
  @Roles('admin', 'owner', 'employee')
  create(@Body() dto: CreateVehicleDto, @User('sub') userId: string) {
    return this.vehiclesService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('admin', 'owner', 'employee')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'owner', 'employee')
  remove(@Param('id') id: string, @User('sub') userId: string) {
    return this.vehiclesService.remove(id, userId);
  }
}
