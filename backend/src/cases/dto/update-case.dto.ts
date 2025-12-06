import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateCaseDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  expertName?: string;

  @IsOptional()
  @IsString()
  caseNumber?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  tcVkn?: string;

  @IsOptional()
  @IsDateString()
  damageDate?: string;
}
