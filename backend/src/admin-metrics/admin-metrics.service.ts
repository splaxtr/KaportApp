import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalMetrics() {
    const [shops, users, vehicles, partsPending, last24hActions] = await Promise.all([
      this.prisma.shop.count({ where: { deletedAt: null } }),
      this.prisma.user.count(),
      this.prisma.vehicle.count({ where: { deletedAt: null } }),
      this.prisma.part.count({ where: { deletedAt: null, statusKey: 'pending' } }),
      this.prisma.activity.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);
    return { shops, users, vehicles, partsPending, last24hActions };
  }

  async getSystemMetrics() {
    let dbLatency = 0;
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch {
      dbLatency = 0;
    }
    return {
      apiHealth: 'ok' as const,
      dbLatency,
      storage: 'ok' as const,
      uptime: Math.floor(process.uptime()),
    };
  }

  async getActivities() {
    const rows = await this.prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { actor: true },
    });
    return rows.map((a) => ({
      id: a.id,
      message: (a.payload as any)?.message || a.type,
      createdAt: a.createdAt,
      user: a.actor?.email || a.actor?.name || 'system',
    }));
  }

  async getTopShops() {
    const vehicles = await this.prisma.vehicle.groupBy({
      by: ['shopId'],
      _count: { shopId: true },
    });
    const shops = await this.prisma.shop.findMany({ select: { id: true, name: true } });
    return vehicles
      .map((v) => ({
        shopName: shops.find((s) => s.id === v.shopId)?.name || v.shopId,
        jobCount: v._count.shopId,
      }))
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 10);
  }

  async getPartDistribution() {
    const rows = await this.prisma.part.groupBy({
      by: ['statusKey'],
      where: { deletedAt: null },
      _count: { statusKey: true },
    });
    const statuses = await this.prisma.partStatus.findMany({ select: { key: true, label: true } });
    return rows.map((r) => ({
      status: statuses.find((s) => s.key === r.statusKey)?.label || r.statusKey,
      count: r._count.statusKey,
    }));
  }
}
