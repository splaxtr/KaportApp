import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CaseStatus } from '@prisma/client';

export class UpdateCaseStatusDto {
  @IsEnum(CaseStatus)
  status: CaseStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
