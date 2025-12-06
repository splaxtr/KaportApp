import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { CreateVehicleTaskDto } from './dto/create-vehicle-task.dto';
import { UpdateVehicleTaskDto } from './dto/update-vehicle-task.dto';

@Injectable()
export class VehicleTasksService {
  constructor(
    private prisma: PrismaService,
    private activities: ActivitiesService,
  ) {}

  async ensureCase(caseId: string) {
    const vc = await this.prisma.vehicleCase.findUnique({ where: { id: caseId }, include: { vehicle: true } });
    if (!vc) throw new NotFoundException('Case not found');
    return vc;
  }

  async list(caseId: string) {
    await this.ensureCase(caseId);
    return this.prisma.caseOperation.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(caseId: string, dto: CreateVehicleTaskDto, userId: string) {
    const vc = await this.ensureCase(caseId);
    const op = await this.prisma.caseOperation.create({
      data: {
        caseId,
        title: dto.title,
        status: dto.status || 'pending',
        notes: dto.notes,
        hours: dto.hours ?? null,
        cost: dto.cost ?? null,
      },
    });
    await this.activities.create({
      scope: 'vehicle_case',
      refId: caseId,
      message: `İşlem eklendi: ${dto.title}`,
      payload: { operationId: op.id, caseId, plate: vc.vehicle.plate },
      type: 'operation_added',
      actorId: userId,
      shopId: vc.vehicle.shopId,
    });
    return op;
  }

  async update(id: string, dto: UpdateVehicleTaskDto, userId: string) {
    const exists = await this.prisma.caseOperation.findUnique({ where: { id }, include: { case: { include: { vehicle: true } } } });
    if (!exists) throw new NotFoundException('Task not found');
    const updated = await this.prisma.caseOperation.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        status: dto.status ?? undefined,
        notes: dto.notes ?? undefined,
        hours: dto.hours ?? undefined,
        cost: dto.cost ?? undefined,
      },
    });
    await this.activities.create({
      scope: 'vehicle_case',
      refId: updated.caseId,
      message: `İşlem güncellendi: ${updated.title}`,
      payload: { operationId: updated.id, caseId: updated.caseId },
      type: 'operation_updated',
      actorId: userId,
      shopId: exists.case.vehicle.shopId,
    });
    return updated;
  }

  async remove(id: string, userId: string) {
    const exists = await this.prisma.caseOperation.findUnique({ where: { id }, include: { case: { include: { vehicle: true } } } });
    if (!exists) throw new NotFoundException('Task not found');
    await this.prisma.caseOperation.delete({ where: { id } });
    await this.activities.create({
      scope: 'vehicle_case',
      refId: exists.caseId,
      message: `İşlem silindi: ${exists.title}`,
      payload: { operationId: exists.id, caseId: exists.caseId },
      type: 'operation_deleted',
      actorId: userId,
      shopId: exists.case.vehicle.shopId,
    });
    return { success: true };
  }
}
