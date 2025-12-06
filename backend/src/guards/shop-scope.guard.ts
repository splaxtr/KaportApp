import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShopScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Forbidden');
    if (user.role === 'admin') return true;

    const shopId = await this.resolveShopId(request);
    if (!shopId) return true;

    if (!user.shopId || user.shopId !== shopId) {
      throw new ForbiddenException('Forbidden');
    }
    return true;
  }

  private async resolveShopId(request: any): Promise<string | undefined> {
    const { params, body, query } = request;

    if (body?.shopId) return body.shopId;
    if (query?.shopId) return query.shopId;
    if (params?.shopId) return params.shopId;

    const caseId = params?.caseId || body?.caseId || query?.caseId;
    if (caseId) {
      const vc = await this.prisma.vehicleCase.findUnique({
        where: { id: caseId },
        include: { vehicle: { select: { shopId: true } } },
      });
      return vc?.vehicle?.shopId;
    }

    const vehicleId = params?.vehicleId || body?.vehicleId || query?.vehicleId;
    if (vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { shopId: true } });
      return vehicle?.shopId;
    }

    return undefined;
  }
}
