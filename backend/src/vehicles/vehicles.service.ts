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

  findAll(filters: { plate?: string } = {}) {
    return this.prisma.vehicle.findMany({
      where: {
        plate: filters.plate ? { contains: filters.plate, mode: 'insensitive' } : undefined,
      },
      include: {
        cases: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            caseNumber: true,
            damageDate: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        cases: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            caseNumber: true,
            damageDate: true,
            status: true,
            createdAt: true,
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
        ownerId: true,
      },
    });
  }

  async create(dto: CreateVehicleDto, creatorId: string) {
    const normalizedPlate = dto.plate?.trim()?.toUpperCase();
    const parsedDamageDate =
      dto.damageDate && !isNaN(new Date(dto.damageDate).getTime()) ? new Date(dto.damageDate) : null;

    const existing = await this.prisma.vehicle.findUnique({
      where: { plate: normalizedPlate },
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

      await this.activitiesService.create(
        { message: 'New case created for existing vehicle', plate: existing.plate, caseId: newCase.id },
        creatorId,
        'vehicle_case',
        newCase.id,
        'case_created',
      );

      return { vehicle: existing, case: newCase };
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
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

    await this.activitiesService.create(
      { message: 'Vehicle created with first case', plate: normalizedPlate, caseId: newCase.id },
      creatorId,
      'vehicle_case',
      newCase.id,
      'vehicle_created',
    );

    return { vehicle, case: newCase };
  }
}
