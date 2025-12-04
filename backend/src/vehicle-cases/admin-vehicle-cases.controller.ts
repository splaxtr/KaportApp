import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateVehicleCaseDto } from './dto/create-vehicle-case.dto';
import { TransferCaseOwnerDto } from './dto/transfer-case-owner.dto';
import { UpdateVehicleCaseDto } from './dto/update-vehicle-case.dto';
import { VehicleCasesService } from './vehicle-cases.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminVehicleCasesController {
  constructor(private readonly service: VehicleCasesService) {}

  @Post('vehicles/:id/cases')
  createCase(@Param('id') vehicleId: string, @Body() dto: CreateVehicleCaseDto) {
    return this.service.create(vehicleId, dto, 'admin');
  }

  @Get('vehicles/:id/cases')
  listCases(@Param('id') vehicleId: string) {
    return this.service.listByVehicle(vehicleId);
  }

  @Get('cases/:caseId')
  caseDetail(@Param('caseId') caseId: string) {
    return this.service.findOne(caseId);
  }

  @Patch('cases/:caseId')
  updateCase(@Param('caseId') caseId: string, @Body() dto: UpdateVehicleCaseDto) {
    return this.service.update(caseId, dto, 'admin');
  }

  @Delete('cases/:caseId')
  deleteCase(@Param('caseId') caseId: string) {
    return this.service.remove(caseId, 'admin');
  }

  @Post('cases/:caseId/transfer-owner')
  transferOwner(@Param('caseId') caseId: string, @Body() dto: TransferCaseOwnerDto) {
    return this.service.transferOwner(caseId, dto.newOwnerId, 'admin');
  }
}
