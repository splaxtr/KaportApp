import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateVehicleCaseDto {
  @IsString()
  vehicleId: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  caseNumber?: string;

  @IsOptional()
  @IsDateString()
  damageDate?: string;

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
