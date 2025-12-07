import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { UpdateCaseDto } from './dto/update-case.dto';
import { UpdateCaseStatusDto } from './dto/update-case-status.dto';
import { CaseStatus } from '@prisma/client';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService, private activities: ActivitiesService) {}

  async findCase(caseId: string) {
    const caseItem = await this.prisma.vehicleCase.findUnique({
      where: { id: caseId },
      include: { vehicle: true, owner: true },
    });
    if (!caseItem) throw new NotFoundException('Case not found');
    return caseItem;
  }

  async getCaseDetail(caseId: string) {
    const caseItem = await this.findCase(caseId);
    const [parts, photos, operations, activity, timeline] = await Promise.all([
      this.prisma.casePart.findMany({ where: { caseId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.casePhoto.findMany({ where: { caseId }, orderBy: { takenAt: 'desc' } }),
      this.prisma.caseOperation.findMany({ where: { caseId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.activity.findMany({ where: { scope: 'vehicle_case', refId: caseId }, orderBy: { createdAt: 'desc' } }),
      this.getTimeline(caseId),
    ]);

    return {
      case: caseItem,
      vehicle: caseItem.vehicle && {
        id: caseItem.vehicle.id,
        plate: caseItem.vehicle.plate,
        brand: caseItem.vehicle.brand,
        model: caseItem.vehicle.model,
        year: caseItem.vehicle.year,
      },
      parts,
      photos,
      operations,
      activity,
      timeline,
    };
  }

  async updateCase(caseId: string, dto: UpdateCaseDto, actorId: string) {
    const caseItem = await this.findCase(caseId);
    const nextStatus =
      dto.status && Object.values(CaseStatus).includes(dto.status as CaseStatus)
        ? (dto.status as CaseStatus)
        : undefined;
    const updated = await this.prisma.vehicleCase.update({
      where: { id: caseId },
      data: {
        status: nextStatus,
        closedAt: nextStatus === CaseStatus.delivered ? new Date() : undefined,
        notes: dto.notes ?? undefined,
        expertName: dto.expertName ?? undefined,
        caseNumber: dto.caseNumber ?? undefined,
        phone: dto.phone ?? undefined,
        tcVkn: dto.tcVkn ?? undefined,
        damageDate: dto.damageDate ? new Date(dto.damageDate) : undefined,
      },
    });
    await this.activities.logCase(caseId, actorId, 'case_updated', {
      plate: caseItem.vehicle?.plate,
      status: updated.status,
    });
    return updated;
  }

  async deleteCase(caseId: string, actorId: string) {
    await this.findCase(caseId);
    await this.prisma.vehicleCase.delete({ where: { id: caseId } });
    await this.activities.logCase(caseId, actorId, 'case_deleted', {});
    return { success: true };
  }

  async listCasesForVehicle(vehicleId: string) {
    return this.prisma.vehicleCase.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
      include: { owner: true },
    });
  }

  async listAll() {
    return this.prisma.vehicleCase.findMany({ orderBy: { createdAt: 'desc' }, include: { vehicle: true } });
  }

  async getActivity(caseId: string) {
    await this.findCase(caseId);
    return this.prisma.activity.findMany({
      where: { scope: 'vehicle_case', refId: caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(caseId: string, dto: UpdateCaseStatusDto, actorId: string) {
    const caseItem = await this.findCase(caseId);
    const allowed: CaseStatus[] = [
      CaseStatus.opened,
      CaseStatus.inspection,
      CaseStatus.parts_waiting,
      CaseStatus.repairing,
      CaseStatus.paint,
      CaseStatus.ready,
      CaseStatus.delivered,
    ];
    if (!allowed.includes(dto.status)) {
      throw new NotFoundException('Invalid status');
    }

    const updated = await this.prisma.vehicleCase.update({
      where: { id: caseId },
      data: {
        status: dto.status,
        closedAt: dto.status === CaseStatus.delivered ? new Date() : null,
      },
    });

    await this.activities.logCaseStatusChange(caseId, actorId, caseItem.status, dto.status, dto.notes);
    return updated;
  }

  async getTimeline(caseId: string) {
    await this.findCase(caseId);
    const activity = await this.prisma.activity.findMany({
      where: { scope: 'vehicle_case', refId: caseId },
      orderBy: { createdAt: 'desc' },
    });
    return activity.map((a) => ({ type: a.type, createdAt: a.createdAt, data: a.payload }));
  }
}
