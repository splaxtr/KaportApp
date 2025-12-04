import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
  ) {}

  findAllByShop(shopId?: string) {
    if (!shopId) {
      return this.prisma.vehicle.findMany({ where: { deletedAt: null } });
    }
    return this.prisma.vehicle.findMany({ where: { shopId, deletedAt: null } });
  }

  findAllAdmin(filters: {
    plate?: string;
    brand?: string;
    model?: string;
    year?: number;
    shopId?: string;
    package?: string;
    ownerId?: string;
    includeHistory?: boolean;
  }) {
    return this.prisma.vehicle.findMany({
      where: {
        deletedAt: null,
        shopId: filters.shopId || undefined,
        plate: filters.plate ? { contains: filters.plate, mode: 'insensitive' } : undefined,
        brand: filters.brand ? { contains: filters.brand, mode: 'insensitive' } : undefined,
        model: filters.model ? { contains: filters.model, mode: 'insensitive' } : undefined,
        year: filters.year || undefined,
        package: filters.package
          ? {
              contains: filters.package,
              mode: 'insensitive',
            }
          : undefined,
        OR: filters.ownerId
          ? [
              { currentOwnerId: filters.ownerId },
              {
                ownerHistory: {
                  some: {
                    ownerId: filters.ownerId,
                  },
                },
              },
            ]
          : undefined,
      },
      include: {
        shop: { select: { id: true, name: true } },
        currentOwner: { select: { id: true, name: true, phone: true, email: true } },
        ownerHistory: filters.includeHistory ? true : false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async findOneAdmin(id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
      include: {
        shop: { select: { id: true, name: true } },
        currentOwner: { select: { id: true, name: true, phone: true, email: true } },
        cases: {
          select: {
            id: true,
            caseNumber: true,
            damageDate: true,
            owner: { select: { id: true, name: true, phone: true } },
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        ownerHistory: true,
      },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async create(dto: CreateVehicleDto, creatorId: string) {
    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...dto,
        notes: dto.notes,
        package: dto.package,
        createdBy: creatorId,
      },
    });
    await this.activitiesService.log(
      creatorId,
      dto.shopId,
      `Vehicle created: ${vehicle.plate}`,
      vehicle.id,
      'vehicle',
    );
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...dto,
        notes: dto.notes,
        package: dto.package,
      },
    });
  }

  async remove(id: string, userId: string) {
    const vehicle = await this.findOne(id);
    await this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.activitiesService.log(
      userId,
      vehicle.shopId,
      `Vehicle deleted: ${vehicle.plate}`,
      vehicle.id,
      'vehicle',
    );
    return { success: true };
  }

  async timeline(
    vehicleId: string,
    options: { type?: string; limit?: number; offset?: number } = {},
  ) {
    await this.findOne(vehicleId);
    const activities = await this.prisma.activity.findMany({
      where: { refId: vehicleId },
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 100,
      skip: options.offset ?? 0,
    });
    return activities;
  }
}
