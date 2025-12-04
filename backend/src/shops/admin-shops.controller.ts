import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopsService } from './shops.service';

@Controller('admin/shops')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  findAll() {
    return this.shopsService.findAllWithCounts().then((shops) =>
      shops.map((s) => ({
        id: s.id,
        name: s.name,
        owner: s.owner,
        usersCount: s._count?.users ?? 0,
        vehiclesCount: s._count?.vehicles ?? 0,
        status: 'active',
        createdAt: s.createdAt,
      })),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateShopDto) {
    return this.shopsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShopDto) {
    return this.shopsService.update(id, dto);
  }
}
