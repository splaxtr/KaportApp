import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  shopId: string;

  @IsString()
  plate: string;

  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  package?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
