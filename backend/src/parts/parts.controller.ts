import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { PartsService } from './parts.service';

@Controller('parts')
@UseGuards(AuthGuard('jwt'), RolesGuard, ShopScopeGuard)
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Get()
  @Roles('admin', 'owner', 'employee')
  findByVehicle(@Query('vehicleId') vehicleId: string) {
    return this.partsService.findByVehicle(vehicleId);
  }

  @Post()
  @Roles('admin', 'owner', 'employee')
  create(@Body() dto: CreatePartDto, @User('sub') userId: string) {
    return this.partsService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('admin', 'owner', 'employee')
  update(@Param('id') id: string, @Body() dto: UpdatePartDto, @User('sub') userId: string) {
    return this.partsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('admin', 'owner', 'employee')
  remove(@Param('id') id: string, @User('sub') userId: string) {
    return this.partsService.removeWithUser(id, userId);
  }
}
