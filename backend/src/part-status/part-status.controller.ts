import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { PartStatusService } from './part-status.service';

@Controller('part-statuses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'owner')
export class PartStatusController {
  constructor(private readonly partStatusService: PartStatusService) {}

  @Get()
  findAll() {
    return this.partStatusService.findAll();
  }

  @Post()
  create(@Body() dto: CreateStatusDto) {
    return this.partStatusService.create(dto);
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateStatusDto) {
    return this.partStatusService.update(key, dto);
  }

  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.partStatusService.remove(key);
  }
}
