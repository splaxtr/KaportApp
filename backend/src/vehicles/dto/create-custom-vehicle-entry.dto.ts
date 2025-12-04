import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCustomVehicleEntryDto {
  @ApiProperty() @IsString() shopId: string;
  @ApiProperty() @IsString() brand: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() model?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() year?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() package?: string;
}
