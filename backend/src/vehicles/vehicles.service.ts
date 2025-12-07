import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async findAll(filters: {
    plate?: string;
    brand?: string;
    model?: string;
    year?: number;
    shopId?: string;
  } = {}) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        plate: filters.plate ? { contains: filters.plate, mode: 'insensitive' } : undefined,
        brand: filters.brand ? { contains: filters.brand, mode: 'insensitive' } : undefined,
        model: filters.model ? { contains: filters.model, mode: 'insensitive' } : undefined,
        year: filters.year ?? undefined,
        shopId: filters.shopId ?? undefined,
      },
      include: {
        shop: { select: { id: true, name: true } },
        cases: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            damageDate: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map((v) => {
      const last = v.cases?.[0];
      return {
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: v.year,
        createdAt: v.createdAt,
        shop: v.shop,
        lastCase: last
          ? {
              id: last.id,
              damageDate: last.damageDate,
              status: last.status,
              createdAt: last.createdAt,
            }
          : null,
      };
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        shop: { select: { id: true, name: true } },
        cases: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            caseNumber: true,
            damageDate: true,
            status: true,
            createdAt: true,
            closedAt: true,
            owner: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async findCases(vehicleId: string) {
    await this.findOne(vehicleId);
    return this.prisma.vehicleCase.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        caseNumber: true,
        damageDate: true,
        status: true,
        createdAt: true,
        closedAt: true,
        owner: { select: { id: true, name: true } },
      },
    });
  }

  async create(dto: CreateVehicleDto, creatorId: string) {
    const normalizedPlate = dto.plate?.trim()?.toUpperCase();
    const parsedDamageDate =
      dto.damageDate && !isNaN(new Date(dto.damageDate).getTime()) ? new Date(dto.damageDate) : null;

    const existing = await this.prisma.vehicle.findUnique({
      where: { shopId_plate: { shopId: dto.shopId, plate: normalizedPlate } },
    });

    if (existing) {
      const newCase = await this.prisma.vehicleCase.create({
        data: {
          vehicleId: existing.id,
          ownerId: dto.ownerId,
          damageDate: parsedDamageDate,
          caseNumber: dto.caseNumber,
          expertName: dto.expertName,
          phone: dto.phone,
          tcVkn: dto.tcVkn,
          notes: dto.notes,
        },
      });

      await this.activitiesService.create({
        scope: 'vehicle_case',
        refId: newCase.id,
        type: 'case_created',
        payload: { action: 'case_created', plate: existing.plate, caseId: newCase.id, vehicleId: existing.id },
        actorId: creatorId,
        shopId: existing.shopId,
      });

      return { vehicle: existing, case: newCase };
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        shopId: dto.shopId,
        plate: normalizedPlate,
        brand: dto.brand || null,
        model: dto.model || null,
        year: dto.year,
        currentOwnerId: dto.ownerId,
        createdBy: creatorId,
      },
    });

    const newCase = await this.prisma.vehicleCase.create({
      data: {
        vehicleId: vehicle.id,
        ownerId: dto.ownerId,
        damageDate: parsedDamageDate,
        caseNumber: dto.caseNumber,
        expertName: dto.expertName,
        phone: dto.phone,
        tcVkn: dto.tcVkn,
        notes: dto.notes,
      },
    });

    await this.activitiesService.create({
      scope: 'vehicle_case',
      refId: newCase.id,
      type: 'vehicle_created',
      payload: {
        action: 'vehicle_created',
        plate: normalizedPlate,
        caseId: newCase.id,
        vehicleId: vehicle.id,
      },
      actorId: creatorId,
      shopId: dto.shopId,
    });

    return { vehicle, case: newCase };
  }
}
