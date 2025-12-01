import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreatePhotoDto {
  @IsString()
  shopId: string;

  @IsString()
  vehicleId: string;

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
