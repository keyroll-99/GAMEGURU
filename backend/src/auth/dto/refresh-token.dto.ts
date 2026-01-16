import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'Refresh token musi być tekstem' })
  @IsNotEmpty({ message: 'Refresh token jest wymagany' })
  refreshToken: string;
}
