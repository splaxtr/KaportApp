import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';

@Injectable()
export class PartsService {
  constructor(private prisma: PrismaService, private activitiesService: ActivitiesService) {}

  private async assertCase(caseId: string) {
    const vc = await this.prisma.vehicleCase.findUnique({
      where: { id: caseId },
      include: { vehicle: { select: { shopId: true, plate: true } } },
    });
    if (!vc) throw new NotFoundException('Case not found');
    return vc;
  }

  async findByCase(caseId: string) {
    await this.assertCase(caseId);
    return this.prisma.casePart.findMany({ where: { caseId }, orderBy: { createdAt: 'desc' } });
  }

  async create(caseId: string, dto: CreatePartDto, userId: string) {
    const vc = await this.assertCase(caseId);
    const part = await this.prisma.casePart.create({
      data: {
        caseId,
        name: dto.name,
        status: dto.status,
        price: dto.price ?? null,
      },
    });
    await this.activitiesService.create({
      scope: 'vehicle_case',
      refId: caseId,
      payload: { partId: part.id, caseId, plate: vc.vehicle.plate, action: 'part_created', name: part.name },
      type: 'part_created',
      actorId: userId,
      shopId: vc.vehicle.shopId,
    });
    return part;
  }

  async update(id: string, dto: UpdatePartDto, userId: string) {
    const exists = await this.prisma.casePart.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Part not found');
    const vc = await this.assertCase(exists.caseId);
    const updated = await this.prisma.casePart.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        status: dto.status ?? undefined,
        price: dto.price ?? undefined,
      },
    });
    await this.activitiesService.create({
      scope: 'vehicle_case',
      refId: updated.caseId,
      payload: { partId: updated.id, caseId: updated.caseId, action: 'part_updated', name: updated.name },
      type: 'part_updated',
      actorId: userId,
      shopId: vc.vehicle.shopId,
    });
    return updated;
  }

  async removeWithUser(id: string, userId: string) {
    const exists = await this.prisma.casePart.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Part not found');
    await this.prisma.casePart.delete({ where: { id } });
    await this.activitiesService.create({
      scope: 'vehicle_case',
      refId: exists.caseId,
      payload: { partId: exists.id, caseId: exists.caseId, action: 'part_deleted', name: exists.name },
      type: 'part_deleted',
      actorId: userId,
      shopId: null,
    });
    return { success: true };
  }
}
