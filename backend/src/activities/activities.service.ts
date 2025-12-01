import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  findAll(scope?: string, refId?: string) {
    return this.prisma.activity.findMany({
      where: {
        scope: scope || undefined,
        refId: refId || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(payload: any, actorId: string, scope: string, refId: string, type: string) {
    return this.prisma.activity.create({
      data: {
        payload,
        actorId,
        scope,
        refId,
        type,
      },
    });
  }

  async log(
    userId: string,
    shopId: string | null,
    message: string,
    refId = 'none',
    scope = 'log',
  ) {
    const formatted = `${new Date().toISOString()} user:${userId} shop:${shopId ?? 'none'} → ${message}`;
    await this.prisma.activity.create({
      data: {
        actorId: userId,
        scope,
        refId,
        type: 'log',
        payload: { message: formatted },
      },
    });
  }
}
