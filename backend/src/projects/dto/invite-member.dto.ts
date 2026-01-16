import { IsEmail } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Nieprawidłowy format adresu email' })
  email: string;
}
