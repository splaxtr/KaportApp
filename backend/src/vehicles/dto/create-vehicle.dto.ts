import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

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
  customerName?: string;

  @IsOptional()
  @IsString()
  tcknVkn?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  damageDate?: string;

  @IsOptional()
  @IsString()
  fileNo?: string;

  @IsOptional()
  @IsString()
  expertName?: string;
}
