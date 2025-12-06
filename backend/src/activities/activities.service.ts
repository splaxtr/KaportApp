import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ActivityInput = {
  scope: string;
  refId: string;
  type: string;
  payload: any;
  actorId: string;
  shopId?: string | null;
};

@Injectable()
export class ActivitiesService {
  constructor(public prisma: PrismaService) {}

  findAll(scope?: string, refId?: string) {
    return this.prisma.activity.findMany({
      where: {
        scope: scope || undefined,
        refId: refId || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(entry: ActivityInput): Promise<any>;
  create(payload: any, actorId: string, scope: string, refId: string, type: string): Promise<any>;
  create(
    arg1: ActivityInput | any,
    actorId?: string,
    scope?: string,
    refId?: string,
    type?: string,
  ) {
    const data: ActivityInput =
      typeof arg1 === 'object' && 'scope' in arg1
        ? (arg1 as ActivityInput)
        : {
            payload: arg1,
            actorId: actorId as string,
            scope: scope as string,
            refId: refId as string,
            type: type as string,
            shopId: null,
          };

    return this.prisma.activity.create({
      data: {
        scope: data.scope,
        refId: data.refId,
        type: data.type,
        payload: data.payload,
        actorId: data.actorId,
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

  async logCase(caseId: string, userId: string, action: string, meta: Record<string, any>) {
    await this.prisma.activity.create({
      data: {
        scope: 'vehicle_case',
        refId: caseId,
        type: action,
        actorId: userId,
        payload: { action, caseId, ...meta },
      },
    });
  }

  async logCaseStatusChange(caseId: string, userId: string, from: string | null, to: string, notes?: string) {
    await this.logCase(caseId, userId, 'case_status_changed', { from, to, notes });
  }
}
