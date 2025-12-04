import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleCaseDto } from './dto/create-vehicle-case.dto';
import { UpdateVehicleCaseDto } from './dto/update-vehicle-case.dto';

@Injectable()
export class VehicleCasesService {
  constructor(
    private prisma: PrismaService,
    private activities: ActivitiesService,
  ) {}

  listByVehicle(vehicleId: string) {
    return this.prisma.vehicleCase.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(caseId: string) {
    const vc = await this.prisma.vehicleCase.findUnique({
      where: { id: caseId },
      include: {
        vehicle: true,
        parts: { where: { deletedAt: null }, include: { status: true } },
        photos: { where: { deletedAt: null } },
        activities: { orderBy: { createdAt: 'desc' } },
        owner: true,
      },
    });
    if (!vc) throw new NotFoundException('Case not found');
    return vc;
  }

  async create(vehicleId: string, dto: CreateVehicleCaseDto, userId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, deletedAt: null } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    const created = await this.prisma.$transaction(async (tx) => {
      const vc = await tx.vehicleCase.create({
        data: {
          vehicleId,
          ownerId: dto.ownerId,
          caseNumber: dto.caseNumber,
          damageDate: dto.damageDate ? new Date(dto.damageDate) : undefined,
          expertName: dto.expertName,
          phone: dto.phone,
          tcVkn: dto.tcVkn,
          notes: dto.notes,
        },
      });
      if (dto.ownerId) {
        await tx.vehicleOwnerHistory.updateMany({
          where: { vehicleId, releasedAt: null },
          data: { releasedAt: new Date() },
        });
        await tx.vehicleOwnerHistory.create({
          data: { vehicleId, ownerId: dto.ownerId, assignedAt: new Date() },
        });
        await tx.vehicle.update({ where: { id: vehicleId }, data: { currentOwnerId: dto.ownerId } });
      }
      return vc;
    });
    await this.activities.log(userId, vehicle.shopId, `Case created for vehicle ${vehicle.plate}`, created.id, 'case');
    return created;
  }

  async update(caseId: string, dto: UpdateVehicleCaseDto, userId: string) {
    const exists = await this.prisma.vehicleCase.findUnique({ where: { id: caseId } });
    if (!exists) throw new NotFoundException('Case not found');
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedCase = await tx.vehicleCase.update({
        where: { id: caseId },
        data: {
          ownerId: dto.ownerId ?? undefined,
          caseNumber: dto.caseNumber ?? undefined,
          damageDate: dto.damageDate ? new Date(dto.damageDate) : undefined,
          expertName: dto.expertName ?? undefined,
          phone: dto.phone ?? undefined,
          tcVkn: dto.tcVkn ?? undefined,
          notes: dto.notes ?? undefined,
        },
      });
      if (dto.ownerId) {
        await tx.vehicleOwnerHistory.updateMany({
          where: { vehicleId: exists.vehicleId, releasedAt: null },
          data: { releasedAt: new Date() },
        });
        await tx.vehicleOwnerHistory.create({
          data: { vehicleId: exists.vehicleId, ownerId: dto.ownerId, assignedAt: new Date() },
        });
        await tx.vehicle.update({ where: { id: exists.vehicleId }, data: { currentOwnerId: dto.ownerId } });
      }
      return updatedCase;
    });
    await this.activities.log(userId, exists.vehicleId, `Case updated`, caseId, 'case');
    return updated;
  }

  async remove(caseId: string, userId: string) {
    const exists = await this.prisma.vehicleCase.findUnique({ where: { id: caseId } });
    if (!exists) throw new NotFoundException('Case not found');
    await this.prisma.vehicleCase.delete({ where: { id: caseId } });
    await this.activities.log(userId, exists.vehicleId, `Case deleted`, caseId, 'case');
    return { success: true };
  }

  async transferOwner(caseId: string, newOwnerId: string, userId: string) {
    const exists = await this.prisma.vehicleCase.findUnique({ where: { id: caseId } });
    if (!exists) throw new NotFoundException('Case not found');
    const updated = await this.prisma.$transaction(async (tx) => {
      const c = await tx.vehicleCase.update({
        where: { id: caseId },
        data: { ownerId: newOwnerId },
      });
      await tx.vehicleOwnerHistory.updateMany({
        where: { vehicleId: exists.vehicleId, releasedAt: null },
        data: { releasedAt: new Date() },
      });
      await tx.vehicleOwnerHistory.create({
        data: { vehicleId: exists.vehicleId, ownerId: newOwnerId, assignedAt: new Date() },
      });
      await tx.vehicle.update({ where: { id: exists.vehicleId }, data: { currentOwnerId: newOwnerId } });
      return c;
    });
    await this.activities.log(userId, exists.vehicleId, `Case owner changed to ${newOwnerId}`, caseId, 'case');
    return updated;
  }
}
