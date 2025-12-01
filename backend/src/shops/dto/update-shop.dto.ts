import { IsOptional, IsString } from 'class-validator';

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  name?: string;
}
