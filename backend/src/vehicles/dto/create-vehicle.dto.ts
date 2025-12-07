import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  shopId: string;

  @IsString()
  plate: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  package?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  ownerId: string;

  @IsOptional()
  @IsString()
  caseNumber?: string;

  @IsOptional()
  @IsString()
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
}
