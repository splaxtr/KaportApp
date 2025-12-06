import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.shop.findMany({
      where: { deletedAt: null },
      include: { owner: true },
    });
  }

  findAllWithCounts() {
    return this.prisma.shop.findMany({
      where: { deletedAt: null },
      include: {
        owner: true,
        _count: {
          select: { users: true, vehicles: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!shop || shop.deletedAt) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  async ensureExists(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!shop || shop.deletedAt) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  create(dto: CreateShopDto) {
    return this.prisma.shop.create({ data: dto });
  }

  async update(id: string, dto: UpdateShopDto) {
    await this.ensureExists(id);
    const data: any = { ...dto };
    if (dto.ownerId) data.ownerId = dto.ownerId;
    return this.prisma.shop.update({ where: { id }, data });
  }

  async assignOwner(id: string, ownerId: string) {
    await this.ensureExists(id);
    return this.prisma.shop.update({ where: { id }, data: { ownerId } });
  }

  async assignEmployee(id: string, userId: string) {
    await this.ensureExists(id);
    return this.prisma.user.update({ where: { id: userId }, data: { shopId: id } });
  }

  async listEmployees(id: string) {
    await this.ensureExists(id);
    return this.prisma.user.findMany({
      where: { shopId: id },
      select: { id: true, name: true, email: true, role: true, shopId: true },
    });
  }

  async removeEmployee(id: string, userId: string) {
    await this.ensureExists(id);
    return this.prisma.user.update({ where: { id: userId }, data: { shopId: null } });
  }

  async softDelete(id: string) {
    const shop = await this.ensureExists(id);
    await this.prisma.shop.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true, id: shop.id };
  }
}
