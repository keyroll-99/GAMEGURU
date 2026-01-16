import { IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Username musi być tekstem' })
  @MinLength(3, { message: 'Username musi mieć minimum 3 znaki' })
  @MaxLength(50, { message: 'Username może mieć maksymalnie 50 znaków' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username może zawierać tylko litery, cyfry, _ i -',
  })
  username?: string;
}
