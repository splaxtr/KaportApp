import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopsService } from './shops.service';

@Controller('shops')
@UseGuards(AuthGuard('jwt'), RolesGuard, ShopScopeGuard)
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  @Roles('admin', 'owner')
  findAll() {
    return this.shopsService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'owner')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateShopDto) {
    return this.shopsService.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'owner')
  update(@Param('id') id: string, @Body() dto: UpdateShopDto) {
    return this.shopsService.update(id, dto);
  }

  @Post(':id/assign-owner')
  @Roles('admin')
  assignOwner(@Param('id') id: string, @Body('ownerId') ownerId: string) {
    return this.shopsService.assignOwner(id, ownerId);
  }

  @Post(':id/assign-employee')
  @Roles('admin', 'owner')
  assignEmployee(@Param('id') id: string, @Body('userId') userId: string) {
    return this.shopsService.assignEmployee(id, userId);
  }

  @Delete(':id/remove-employee')
  @Roles('admin', 'owner')
  removeEmployee(@Param('id') id: string, @Body('userId') userId: string) {
    return this.shopsService.removeEmployee(id, userId);
  }

  @Get(':shopId/employees')
  @Roles('admin', 'owner')
  listEmployees(@Param('shopId') shopId: string) {
    return this.shopsService.listEmployees(shopId);
  }

  @Delete(':id')
  @Roles('admin')
  softDelete(@Param('id') id: string) {
    return this.shopsService.softDelete(id);
  }
}
