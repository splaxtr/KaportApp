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

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
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
        createdBy: creatorId,
        damageDate: dto.damageDate ? new Date(dto.damageDate) : undefined,
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
        damageDate: dto.damageDate ? new Date(dto.damageDate) : undefined,
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

  async timeline(vehicleId: string) {
    await this.findOne(vehicleId);
    const activities = await this.prisma.activity.findMany({
      where: { refId: vehicleId },
      orderBy: { createdAt: 'desc' },
    });
    const histories = await this.prisma.partStatusHistory.findMany({
      where: { part: { vehicleId } },
      orderBy: { changedAt: 'desc' },
    });
    const activityEvents = activities.map((a) => ({ eventType: 'activity', ...a }));
    const historyEvents = histories.map((h) => ({ eventType: 'partStatus', ...h }));
    return [...activityEvents, ...historyEvents].sort((a: any, b: any) => {
      const aDate = a.changedAt || a.createdAt;
      const bDate = b.changedAt || b.createdAt;
      return new Date(bDate as any).getTime() - new Date(aDate as any).getTime();
    });
  }
}
