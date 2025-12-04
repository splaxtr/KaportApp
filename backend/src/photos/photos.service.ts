import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import * as fs from 'fs';

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
  ) {}

  findMany(filter: { caseId?: string; shopId?: string }) {
    return this.prisma.photo.findMany({
      where: {
        deletedAt: null,
        caseId: filter.caseId || undefined,
        shopId: filter.shopId || undefined,
      },
      orderBy: { takenAt: 'desc' },
    });
  }

  async create(dto: CreatePhotoDto, userId: string) {
    const caseRecord = dto.caseId
      ? await this.prisma.vehicleCase.findUnique({
          where: { id: dto.caseId },
          include: { vehicle: true },
        })
      : null;
    if (dto.caseId && !caseRecord) {
      throw new NotFoundException('Case not found');
    }
    const resolvedShopId = dto.shopId || caseRecord?.vehicle.shopId;
    if (!resolvedShopId) {
      throw new BadRequestException('shopId is required');
    }
    const photo = await this.prisma.photo.create({
      data: {
        shopId: resolvedShopId,
        caseId: caseRecord?.id ?? undefined,
        url: dto.url ?? '',
        storagePath: dto.storagePath ?? '',
        takenAt: dto.takenAt ? new Date(dto.takenAt) : undefined,
        addedBy: userId,
      },
    });
    const ref = caseRecord?.vehicleId || caseRecord?.id || 'none';
    await this.activitiesService.log(userId, resolvedShopId || null, 'Photo uploaded', ref, 'photo');
    return photo;
  }

  async createFromFile(dto: CreatePhotoDto, userId: string, url: string, storagePath: string) {
    const caseRecord = dto.caseId
      ? await this.prisma.vehicleCase.findUnique({
          where: { id: dto.caseId },
          include: { vehicle: true },
        })
      : null;
    if (dto.caseId && !caseRecord) {
      throw new NotFoundException('Case not found');
    }
    const resolvedShopId = dto.shopId || caseRecord?.vehicle.shopId;
    if (!resolvedShopId) {
      throw new BadRequestException('shopId is required');
    }
    const photo = await this.prisma.photo.create({
      data: {
        shopId: resolvedShopId,
        caseId: caseRecord?.id ?? undefined,
        url,
        storagePath,
        takenAt: dto.takenAt ? new Date(dto.takenAt) : undefined,
        addedBy: userId,
      },
    });
    const ref = caseRecord?.vehicleId || caseRecord?.id || 'none';
    await this.activitiesService.log(userId, resolvedShopId || null, 'Photo uploaded', ref, 'photo');
    return photo;
  }

  async remove(id: string, userId: string) {
    const exists = await this.prisma.photo.findFirst({ where: { id, deletedAt: null } });
    if (!exists) {
      throw new NotFoundException('Photo not found');
    }
    await this.prisma.photo.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    if (exists.storagePath) {
      try {
        await fs.promises.unlink(exists.storagePath);
      } catch {
        // ignore missing file
      }
    }
    const caseRecord = exists.caseId
      ? await this.prisma.vehicleCase.findUnique({ where: { id: exists.caseId } })
      : null;
    const ref = caseRecord?.vehicleId || exists.caseId || undefined;
    await this.activitiesService.log(userId, exists.shopId, 'Photo deleted', ref ?? 'none', 'photo');
    return { success: true };
  }
}
