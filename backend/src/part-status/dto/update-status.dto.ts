import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
