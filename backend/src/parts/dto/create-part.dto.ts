import { IsOptional, IsString } from 'class-validator';

export class CreatePartDto {
  @IsString()
  name: string;

  @IsString()
  status: string;

  @IsOptional()
  price?: number;
}
