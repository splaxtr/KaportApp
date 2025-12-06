import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
@UseGuards(AuthGuard('jwt'), RolesGuard, ShopScopeGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @Roles('admin', 'owner', 'employee')
  findAll(@Query('plate') plate?: string) {
    return this.vehiclesService.findAll({ plate });
  }

  @Get(':id')
  @Roles('admin', 'owner', 'employee')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Get(':id/cases')
  @Roles('admin', 'owner', 'employee')
  listCases(@Param('id') id: string) {
    return this.vehiclesService.findCases(id);
  }

  @Post()
  @Roles('admin', 'owner', 'employee')
  create(@Body() dto: CreateVehicleDto, @User('sub') userId: string) {
    return this.vehiclesService.create(dto, userId);
  }
}
