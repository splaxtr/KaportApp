import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        shopId: true,
        shop: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        shopId: true,
        shop: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(data: { email: string; password: string; name: string; role: string; shopId?: string | null }) {
    const hashed = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: { ...data, password: hashed },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        shopId: true,
        shop: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    } else {
      delete data.password;
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        shopId: true,
        shop: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async changeRole(id: string, role: string) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        shopId: true,
        shop: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async assignShop(id: string, shopId: string | null) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: { shopId: shopId || null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        shopId: true,
        shop: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  getActivity(id: string) {
    return this.prisma.activity.findMany({
      where: { actorId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        payload: true,
        type: true,
        scope: true,
      },
    });
  }
}
