import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { ActivitiesService } from './activities.service';

@Controller('activities')
@UseGuards(AuthGuard('jwt'), RolesGuard, ShopScopeGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @Roles('admin', 'owner', 'employee')
  list(@Query('scope') scope?: string, @Query('refId') refId?: string) {
    return this.activitiesService.findAll(scope, refId);
  }

  @Post()
  @Roles('admin', 'owner', 'employee')
  create(
    @Body('payload') payload: any,
    @Body('scope') scope: string,
    @Body('refId') refId: string,
    @Body('type') type: string,
    @User('sub') userId: string,
  ) {
    return this.activitiesService.create(payload, userId, scope, refId, type);
  }
}
