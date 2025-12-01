import { IsInt, IsString } from 'class-validator';

export class CreateStatusDto {
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsString()
  color: string;

  @IsInt()
  order: number;
}
