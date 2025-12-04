import { IsString } from 'class-validator';

export class TransferCaseOwnerDto {
  @IsString()
  newOwnerId: string;
}
