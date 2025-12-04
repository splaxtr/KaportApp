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
    return this.prisma.vehicleTask.findMany({
      where: { caseId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(caseId: string, dto: CreateVehicleTaskDto, userId: string) {
    const vc = await this.ensureCase(caseId);
    const task = await this.prisma.vehicleTask.create({
      data: {
        caseId,
        title: dto.title,
        status: dto.status || 'pending',
        notes: dto.notes,
      },
    });
    await this.activities.log(userId, vc.vehicle.shopId, `İşlem eklendi: ${dto.title}`, vc.vehicleId, 'task');
    return task;
  }

  async update(id: string, dto: UpdateVehicleTaskDto, userId: string) {
    const exists = await this.prisma.vehicleTask.findFirst({ where: { id, deletedAt: null }, include: { case: { include: { vehicle: true } } } });
    if (!exists) throw new NotFoundException('Task not found');
    const updated = await this.prisma.vehicleTask.update({
      where: { id },
      data: { ...dto },
    });
    await this.activities.log(
      userId,
      exists.case.vehicle.shopId,
      `İşlem güncellendi: ${dto.title || updated.title}`,
      exists.case.vehicleId,
      'task',
    );
    return updated;
  }

  async remove(id: string, userId: string) {
    const exists = await this.prisma.vehicleTask.findFirst({ where: { id, deletedAt: null }, include: { case: { include: { vehicle: true } } } });
    if (!exists) throw new NotFoundException('Task not found');
    await this.prisma.vehicleTask.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.activities.log(userId, exists.case.vehicle.shopId, `İşlem silindi: ${exists.title}`, exists.case.vehicleId, 'task');
    return { success: true };
  }
}
