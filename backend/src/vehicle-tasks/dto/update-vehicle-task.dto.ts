import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateVehicleTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'done'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  hours?: number;

  @IsOptional()
  cost?: number;
}
