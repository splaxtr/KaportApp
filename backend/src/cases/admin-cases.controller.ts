import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CasesService } from './cases.service';

@Controller('admin/cases')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminCasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  @Roles('admin')
  async list() {
    return this.casesService.listAll();
  }

  @Get(':caseId')
  @Roles('admin')
  getCase(@Param('caseId') caseId: string) {
    return this.casesService.findCase(caseId);
  }

  @Get(':caseId/detail')
  @Roles('admin')
  getCaseDetail(@Param('caseId') caseId: string) {
    return this.casesService.getCaseDetail(caseId);
  }

  @Get(':caseId/activity')
  @Roles('admin')
  getCaseActivity(@Param('caseId') caseId: string) {
    return this.casesService.getActivity(caseId);
  }

  @Get(':caseId/timeline')
  @Roles('admin')
  getTimeline(@Param('caseId') caseId: string) {
    return this.casesService.getTimeline(caseId);
  }
}
