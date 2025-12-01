import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.shop.findMany({
      include: { owner: true },
    });
  }

  async findOne(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  create(dto: CreateShopDto) {
    return this.prisma.shop.create({ data: dto });
  }

  async update(id: string, dto: UpdateShopDto) {
    await this.findOne(id);
    return this.prisma.shop.update({ where: { id }, data: dto });
  }

  async assignOwner(id: string, ownerId: string) {
    await this.findOne(id);
    return this.prisma.shop.update({ where: { id }, data: { ownerId } });
  }

  async assignEmployee(id: string, userId: string) {
    await this.findOne(id);
    return this.prisma.user.update({ where: { id: userId }, data: { shopId: id } });
  }

  async removeEmployee(id: string, userId: string) {
    await this.findOne(id);
    return this.prisma.user.update({ where: { id: userId }, data: { shopId: null } });
  }
}
