import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value?.trim?.() ?? value))
  tcVkn?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value?.trim?.() ?? value))
  email?: string;
}
