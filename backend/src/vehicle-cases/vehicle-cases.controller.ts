import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { CreateVehicleCaseDto } from './dto/create-vehicle-case.dto';
import { TransferCaseOwnerDto } from './dto/transfer-case-owner.dto';
import { UpdateVehicleCaseDto } from './dto/update-vehicle-case.dto';
import { VehicleCasesService } from './vehicle-cases.service';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard, ShopScopeGuard)
export class VehicleCasesController {
  constructor(private readonly service: VehicleCasesService) {}

  @Post('vehicles/:id/cases')
  @Roles('admin', 'owner', 'employee')
  createCase(@Param('id') vehicleId: string, @Body() dto: CreateVehicleCaseDto, @User('sub') userId: string) {
    return this.service.create(vehicleId, dto, userId);
  }

  @Get('vehicles/:id/cases')
  @Roles('admin', 'owner', 'employee')
  listCases(@Param('id') vehicleId: string) {
    return this.service.listByVehicle(vehicleId);
  }

  @Get('cases/:caseId')
  @Roles('admin', 'owner', 'employee')
  caseDetail(@Param('caseId') caseId: string) {
    return this.service.findOne(caseId);
  }

  @Patch('cases/:caseId')
  @Roles('admin', 'owner', 'employee')
  updateCase(@Param('caseId') caseId: string, @Body() dto: UpdateVehicleCaseDto, @User('sub') userId: string) {
    return this.service.update(caseId, dto, userId);
  }

  @Delete('cases/:caseId')
  @Roles('admin', 'owner', 'employee')
  deleteCase(@Param('caseId') caseId: string, @User('sub') userId: string) {
    return this.service.remove(caseId, userId);
  }

  @Post('cases/:caseId/transfer-owner')
  @Roles('admin', 'owner')
  transferOwner(@Param('caseId') caseId: string, @Body() dto: TransferCaseOwnerDto, @User('sub') userId: string) {
    return this.service.transferOwner(caseId, dto.newOwnerId, userId);
  }
}
