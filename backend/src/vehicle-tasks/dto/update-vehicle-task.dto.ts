import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateVehicleTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'in_progress', 'done'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
