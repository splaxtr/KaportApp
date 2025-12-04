import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminMetricsService } from './admin-metrics.service';

@Controller('admin/metrics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminMetricsController {
  constructor(private readonly service: AdminMetricsService) {}

  @Get('global')
  getGlobal() {
    return this.service.getGlobalMetrics();
  }

  @Get('system')
  getSystem() {
    return this.service.getSystemMetrics();
  }

  @Get('activities')
  getActivities() {
    return this.service.getActivities();
  }

  @Get('top-shops')
  getTopShops() {
    return this.service.getTopShops();
  }

  @Get('part-status')
  getPartStatus() {
    return this.service.getPartDistribution();
  }
}
