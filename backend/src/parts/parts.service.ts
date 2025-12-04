import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';

@Injectable()
export class PartsService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
  ) {}

  findByCase(caseId: string) {
    return this.prisma.part.findMany({ where: { caseId, deletedAt: null } });
  }

  async create(dto: CreatePartDto, userId: string) {
    const part = await this.prisma.part.create({ data: dto });
    await this.activitiesService.log(userId, dto.shopId, `Part created: ${part.name}`, part.caseId || undefined, 'part');
    return part;
  }

  async update(id: string, dto: UpdatePartDto, userId: string) {
    const exists = await this.prisma.part.findFirst({ where: { id, deletedAt: null } });
    if (!exists) {
      throw new NotFoundException('Part not found');
    }
    if (dto.statusKey && dto.statusKey !== exists.statusKey) {
      await this.prisma.partStatusHistory.create({
        data: {
          partId: id,
          fromStatus: exists.statusKey,
          toStatus: dto.statusKey,
          changedBy: userId,
        },
      });
      await this.activitiesService.log(
        userId,
        exists.shopId,
        `Part status changed: ${exists.statusKey} -> ${dto.statusKey}`,
        exists.caseId || undefined,
        'part',
      );
    }
    const updated = await this.prisma.part.update({ where: { id }, data: dto });
    await this.activitiesService.log(
      userId,
      exists.shopId,
      `Part updated: ${exists.name}`,
      exists.caseId || undefined,
      'part',
    );
    return updated;
  }

  async removeWithUser(id: string, userId: string) {
    const exists = await this.prisma.part.findFirst({ where: { id, deletedAt: null } });
    if (!exists) {
      throw new NotFoundException('Part not found');
    }
    await this.prisma.part.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.activitiesService.log(
      userId,
      exists.shopId,
      `Part deleted: ${exists.name}`,
      exists.caseId || undefined,
      'part',
    );
    return { success: true };
  }

  history(partId: string) {
    return this.prisma.partStatusHistory.findMany({
      where: { partId },
      orderBy: { changedAt: 'desc' },
    });
  }
}
