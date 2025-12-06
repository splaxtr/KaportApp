import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { CreateVehicleTaskDto } from './dto/create-vehicle-task.dto';
import { UpdateVehicleTaskDto } from './dto/update-vehicle-task.dto';
import { VehicleTasksService } from './vehicle-tasks.service';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard, ShopScopeGuard)
export class VehicleTasksController {
  constructor(private readonly service: VehicleTasksService) {}

  @Get('cases/:caseId/operations')
  @Roles('admin', 'owner', 'employee')
  list(@Param('caseId') caseId: string) {
    return this.service.list(caseId);
  }

  @Post('cases/:caseId/operations')
  @Roles('admin', 'owner', 'employee')
  create(
    @Param('caseId') caseId: string,
    @Body() dto: CreateVehicleTaskDto,
    @User('sub') userId: string,
  ) {
    return this.service.create(caseId, dto, userId);
  }

  @Patch('operations/:id')
  @Roles('admin', 'owner', 'employee')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleTaskDto, @User('sub') userId: string) {
    return this.service.update(id, dto, userId);
  }

  @Delete('operations/:id')
  @Roles('admin', 'owner', 'employee')
  remove(@Param('id') id: string, @User('sub') userId: string) {
    return this.service.remove(id, userId);
  }
}
