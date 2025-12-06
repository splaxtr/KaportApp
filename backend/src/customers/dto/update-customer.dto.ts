import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value?.trim?.() ?? value))
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value?.trim?.() ?? value))
  tcVkn?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value?.trim?.() ?? value))
  phone?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value?.trim?.() ?? value))
  email?: string;
}
