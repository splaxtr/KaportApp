import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(dto: CreatePhotoDto, userId: string) {
    const photo = await this.prisma.photo.create({
      data: {
        ...dto,
        url: dto.url ?? '',
        storagePath: dto.storagePath ?? '',
        takenAt: dto.takenAt ? new Date(dto.takenAt) : undefined,
        addedBy: userId,
      },
    });
    await this.activitiesService.log(userId, dto.shopId, 'Photo uploaded');
    return photo;
  }

  async createFromFile(dto: CreatePhotoDto, userId: string, url: string, storagePath: string) {
    const photo = await this.prisma.photo.create({
      data: {
        shopId: dto.shopId,
        vehicleId: dto.vehicleId,
        url,
        storagePath,
        takenAt: dto.takenAt ? new Date(dto.takenAt) : undefined,
        addedBy: userId,
      },
    });
    await this.activitiesService.log(
      userId,
      dto.shopId,
      'Photo uploaded',
      dto.vehicleId,
      'photo',
    );
    return photo;
  }

  async remove(id: string, userId: string) {
    const exists = await this.prisma.photo.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Photo not found');
    }
    await this.prisma.photo.delete({ where: { id } });
    if (exists.storagePath) {
      try {
        await fs.promises.unlink(exists.storagePath);
      } catch {
        // ignore missing file
      }
    }
    await this.activitiesService.log(
      userId,
      exists.shopId,
      'Photo deleted',
      exists.vehicleId,
      'photo',
    );
    return { success: true };
  }
}
