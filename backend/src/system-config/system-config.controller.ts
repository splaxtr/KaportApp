import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SystemConfigService, SystemConfigPayload } from './system-config.service';

@Controller('admin/system-config')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @Patch()
  update(@Body() body: SystemConfigPayload) {
    return this.service.update(body);
  }
}
