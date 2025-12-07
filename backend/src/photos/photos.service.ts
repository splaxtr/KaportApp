import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

@Injectable()
export class PhotosService {
  constructor(private prisma: PrismaService, private activitiesService: ActivitiesService) {}

  private async assertCase(caseId: string) {
    const vc = await this.prisma.vehicleCase.findUnique({
      where: { id: caseId },
      include: { vehicle: { select: { shopId: true, plate: true } } },
    });
    if (!vc) throw new NotFoundException('Case not found');
    return vc;
  }

  findMany(caseId: string) {
    return this.prisma.casePhoto.findMany({
      where: { caseId },
      orderBy: { takenAt: 'desc' },
    });
  }

  async createFromFile(caseId: string, userId: string, url: string, storagePath: string) {
    const vc = await this.assertCase(caseId);
    const photo = await this.prisma.casePhoto.create({
      data: {
        caseId,
        url,
        storagePath,
        takenAt: new Date(),
        addedBy: userId,
      },
    });
    await this.activitiesService.create({
      scope: 'vehicle_case',
      refId: caseId,
      payload: { photoId: photo.id, caseId, plate: vc.vehicle.plate, action: 'photo_uploaded' },
      type: 'photo_uploaded',
      actorId: userId,
      shopId: vc.vehicle.shopId,
    });
    return photo;
  }

  async remove(id: string, userId: string) {
    const exists = await this.prisma.casePhoto.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Photo not found');
    }
    await this.prisma.casePhoto.delete({ where: { id } });
    if (exists.storagePath) {
      try {
        await fs.promises.unlink(exists.storagePath);
      } catch {
        // ignore missing file
      }
    }
    await this.activitiesService.create({
      scope: 'vehicle_case',
      refId: exists.caseId,
      payload: { photoId: exists.id, caseId: exists.caseId, action: 'photo_deleted' },
      type: 'photo_deleted',
      actorId: userId,
      shopId: null,
    });
    return { success: true };
  }
}
