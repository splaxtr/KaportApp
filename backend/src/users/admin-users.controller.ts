import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersService } from './users.service';

@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll().then((users) =>
      users.map((u) => ({
        ...u,
        status: 'active',
      })),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id).then((u) => ({ ...u, status: 'active' }));
  }

  @Post()
  create(
    @Body()
    dto: { name: string; email: string; password: string; role: string; shopId?: string | null },
  ) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    dto: Partial<{ name: string; email: string; role: string; shopId?: string; password?: string } & { shopId?: string | null }>,
  ) {
    const payload = { ...dto, shopId: dto.shopId ?? undefined };
    return this.usersService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Post(':id/role')
  changeRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.changeRole(id, role);
  }

  @Post(':id/shop')
  assignShop(@Param('id') id: string, @Body('shopId') shopId: string | null) {
    return this.usersService.assignShop(id, shopId);
  }

  @Get(':id/activity')
  activity(@Param('id') id: string) {
    return this.usersService.getActivity(id).then((items) =>
      items.map((i) => ({
        id: i.id,
        createdAt: i.createdAt,
        message:
          i && typeof i === 'object' && 'payload' in i && i.payload && typeof (i as any).payload === 'object'
            ? (i as any).payload?.message || i.type
            : i.type,
      })),
    );
  }
}
