import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ShopScopeGuard } from '../guards/shop-scope.guard';
import { PdfService } from './pdf.service';

@Controller('pdf')
@UseGuards(AuthGuard('jwt'), RolesGuard, ShopScopeGuard)
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('vehicle/:id')
  @Roles('admin', 'owner', 'employee')
  async generateVehicle(
    @Param('id') vehicleId: string,
    @User('sub') userId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfService.generateVehicleReport(vehicleId, userId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="vehicle-${vehicleId}.pdf"`,
    });
    res.send(pdfBuffer);
  }
}
