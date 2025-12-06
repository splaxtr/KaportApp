import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { VehiclesService } from './vehicles.service';

@Controller('admin/vehicles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminVehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(@Query('plate') plate?: string) {
    return this.vehiclesService.findAll({ plate });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Get(':id/cases')
  findCases(@Param('id') id: string) {
    return this.vehiclesService.findCases(id);
  }
}
