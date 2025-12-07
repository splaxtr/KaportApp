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

  async listByVehicle(vehicleId: string) {
    return this.prisma.vehicleCase.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
      include: { owner: true },
    });
  }

  async findOne(caseId: string) {
    const vc = await this.prisma.vehicleCase.findUnique({
      where: { id: caseId },
      include: {
        vehicle: { select: { id: true, plate: true, brand: true, model: true, year: true, shopId: true } },
        owner: true,
      },
    });
    if (!vc) throw new NotFoundException('Case not found');
    return vc;
  }

  async create(vehicleId: string, dto: CreateVehicleCaseDto, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, plate: true, shopId: true },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const created = await this.prisma.vehicleCase.create({
      data: {
        vehicleId,
        ownerId: dto.ownerId,
        caseNumber: dto.caseNumber,
        damageDate: dto.damageDate ? new Date(dto.damageDate) : null,
        expertName: dto.expertName,
        phone: dto.phone,
        tcVkn: dto.tcVkn,
        notes: dto.notes,
        status: (dto as any).status || undefined,
      },
    });

    await this.activities.logCase(created.id, userId, 'case_created', {
      plate: vehicle.plate,
      vehicleId: vehicle.id,
      shopId: vehicle.shopId,
    });
    return created;
  }

  async update(caseId: string, dto: UpdateVehicleCaseDto, userId: string) {
    const exists = await this.findOne(caseId);
    const updated = await this.prisma.vehicleCase.update({
      where: { id: caseId },
      data: {
        ownerId: dto.ownerId ?? undefined,
        caseNumber: dto.caseNumber ?? undefined,
        damageDate: dto.damageDate ? new Date(dto.damageDate) : undefined,
        expertName: dto.expertName ?? undefined,
        phone: dto.phone ?? undefined,
        tcVkn: dto.tcVkn ?? undefined,
        notes: dto.notes ?? undefined,
        status: (dto as any).status ?? undefined,
      },
    });
    await this.activities.logCase(caseId, userId, 'case_updated', {
      plate: exists.vehicle.plate,
      vehicleId: exists.vehicle.id,
      shopId: exists.vehicle.shopId,
    });
    return updated;
  }

  async remove(caseId: string, userId: string) {
    const exists = await this.findOne(caseId);
    await this.prisma.vehicleCase.delete({ where: { id: caseId } });
    await this.activities.logCase(caseId, userId, 'case_deleted', {
      plate: exists.vehicle.plate,
      vehicleId: exists.vehicle.id,
      shopId: exists.vehicle.shopId,
    });
    return { success: true };
  }

  async transferOwner(caseId: string, newOwnerId: string, userId: string) {
    const exists = await this.findOne(caseId);
    const updated = await this.prisma.vehicleCase.update({
      where: { id: caseId },
      data: { ownerId: newOwnerId },
    });
    await this.activities.logCase(caseId, userId, 'case_owner_changed', {
      plate: exists.vehicle.plate,
      vehicleId: exists.vehicle.id,
      shopId: exists.vehicle.shopId,
      newOwnerId,
    });
    return updated;
  }
}
