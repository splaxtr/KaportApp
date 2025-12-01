import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShopScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Forbidden');
    }

    const role = user.role;
    if (role === 'admin') {
      return true;
    }

    const targetShopId =
      request.params?.shopId ||
      request.params?.id ||
      request.body?.shopId ||
      request.query?.shopId ||
      null;

    if (!targetShopId) {
      return true;
    }

    const shop = await this.prisma.shop.findUnique({
      where: { id: targetShopId as string },
      select: { id: true, ownerId: true },
    });

    if (!shop) {
      throw new ForbiddenException('Shop not found');
    }

    if (role === 'owner') {
      if (shop.ownerId === user.sub || shop.ownerId === user.id) {
        return true;
      }
      throw new ForbiddenException('Forbidden');
    }

    if (role === 'employee') {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.sub || user.id },
        select: { shopId: true },
      });
      if (dbUser?.shopId === targetShopId) {
        return true;
      }
      throw new ForbiddenException('Forbidden');
    }

    throw new ForbiddenException('Forbidden');
  }
}
