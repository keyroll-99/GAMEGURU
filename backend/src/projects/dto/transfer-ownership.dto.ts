import { IsString, IsUUID } from 'class-validator';

export class TransferOwnershipDto {
  @IsString()
  @IsUUID('4', { message: 'Nieprawidłowy format ID użytkownika' })
  newOwnerId: string;
}
