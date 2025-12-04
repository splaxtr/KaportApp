import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateCustomYearDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  modelId: string;

  @ApiProperty()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shopId: string;
}
