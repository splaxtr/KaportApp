import { IsOptional, IsString } from 'class-validator';

export class CreateCaseDto {
  @IsString()
  ownerId: string;

  @IsOptional()
  @IsString()
  damageDate?: string;

  @IsOptional()
  @IsString()
  caseNumber?: string;

  @IsOptional()
  @IsString()
  expertName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  tcVkn?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
