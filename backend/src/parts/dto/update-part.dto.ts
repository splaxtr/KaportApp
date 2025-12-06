import { IsOptional, IsString } from 'class-validator';

export class UpdatePartDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  price?: number;
}
