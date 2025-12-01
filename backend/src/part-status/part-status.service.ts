import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class PartStatusService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.partStatus.findMany({ orderBy: { order: 'asc' } });
  }

  create(dto: CreateStatusDto) {
    return this.prisma.partStatus.create({ data: dto });
  }

  async update(key: string, dto: UpdateStatusDto) {
    const exists = await this.prisma.partStatus.findUnique({ where: { key } });
    if (!exists) {
      throw new NotFoundException('Status not found');
    }
    return this.prisma.partStatus.update({ where: { key }, data: dto });
  }

  async remove(key: string) {
    const exists = await this.prisma.partStatus.findUnique({ where: { key } });
    if (!exists) {
      throw new NotFoundException('Status not found');
    }
    await this.prisma.partStatus.delete({ where: { key } });
    return { success: true };
  }
}
