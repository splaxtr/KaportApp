import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePartDto {
  @IsString()
  shopId: string;

  @IsString()
  caseId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsString()
  statusKey: string;
}
