import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreatePhotoDto {
  @IsOptional()
  @IsString()
  caseId?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  storagePath?: string;

  @IsOptional()
  @IsDateString()
  takenAt?: string;
}
