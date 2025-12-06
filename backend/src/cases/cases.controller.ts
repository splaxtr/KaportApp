import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { User } from '../common/decorators/user.decorator';
import { CasesService } from './cases.service';
import { UpdateCaseDto } from './dto/update-case.dto';
import { UpdateCaseStatusDto } from './dto/update-case-status.dto';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard, ShopScopeGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get('cases/:caseId')
  @Roles('admin', 'owner', 'employee')
  getCase(@Param('caseId') caseId: string) {
    return this.casesService.findCase(caseId);
  }

  @Get('cases/:caseId/detail')
  @Roles('admin', 'owner', 'employee')
  getCaseDetail(@Param('caseId') caseId: string) {
    return this.casesService.getCaseDetail(caseId);
  }

  @Get('cases/:caseId/activity')
  @Roles('admin', 'owner', 'employee')
  getCaseActivity(@Param('caseId') caseId: string) {
    return this.casesService.getActivity(caseId);
  }

  @Get('cases/:caseId/timeline')
  @Roles('admin', 'owner', 'employee')
  getTimeline(@Param('caseId') caseId: string) {
    return this.casesService.getTimeline(caseId);
  }

  @Patch('cases/:caseId')
  @Roles('admin', 'owner', 'employee')
  updateCase(
    @Param('caseId') caseId: string,
    @Body() dto: UpdateCaseDto,
    @User('sub') userId: string,
  ) {
    return this.casesService.updateCase(caseId, dto, userId);
  }

  @Delete('cases/:caseId')
  @Roles('admin', 'owner', 'employee')
  deleteCase(@Param('caseId') caseId: string, @User('sub') userId: string) {
    return this.casesService.deleteCase(caseId, userId);
  }

  @Post('cases/:caseId/status')
  @Roles('admin', 'owner', 'employee')
  updateStatus(
    @Param('caseId') caseId: string,
    @Body() dto: UpdateCaseStatusDto,
    @User('sub') userId: string,
  ) {
    return this.casesService.updateStatus(caseId, dto, userId);
  }
}
