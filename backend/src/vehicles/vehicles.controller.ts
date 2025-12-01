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
  findAll(@Query('shopId') shopId?: string) {
    return this.vehiclesService.findAllByShop(shopId);
  }

  @Get(':id')
  @Roles('admin', 'owner', 'employee')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Get(':id/timeline')
  @Roles('admin', 'owner', 'employee')
  timeline(@Param('id') id: string) {
    return this.vehiclesService.timeline(id);
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
