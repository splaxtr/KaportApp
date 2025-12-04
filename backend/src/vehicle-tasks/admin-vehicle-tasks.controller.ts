import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateVehicleTaskDto } from './dto/create-vehicle-task.dto';
import { UpdateVehicleTaskDto } from './dto/update-vehicle-task.dto';
import { VehicleTasksService } from './vehicle-tasks.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminVehicleTasksController {
  constructor(private readonly service: VehicleTasksService) {}

  @Get('cases/:caseId/tasks')
  list(@Param('caseId') caseId: string) {
    return this.service.list(caseId);
  }

  @Post('cases/:caseId/tasks')
  create(@Param('caseId') caseId: string, @Body() dto: CreateVehicleTaskDto) {
    return this.service.create(caseId, dto, 'admin');
  }

  @Patch('tasks/:id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleTaskDto) {
    return this.service.update(id, dto, 'admin');
  }

  @Delete('tasks/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(id, 'admin');
  }
}
