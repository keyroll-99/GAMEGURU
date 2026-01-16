import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Podaj poprawny adres email' })
  @IsNotEmpty({ message: 'Email jest wymagany' })
  @MaxLength(255, { message: 'Email może mieć maksymalnie 255 znaków' })
  email: string;

  @IsString({ message: 'Username musi być tekstem' })
  @IsNotEmpty({ message: 'Username jest wymagany' })
  @MinLength(3, { message: 'Username musi mieć minimum 3 znaki' })
  @MaxLength(50, { message: 'Username może mieć maksymalnie 50 znaków' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username może zawierać tylko litery, cyfry, _ i -',
  })
  username: string;

  @IsString({ message: 'Hasło musi być tekstem' })
  @IsNotEmpty({ message: 'Hasło jest wymagane' })
  @MinLength(8, { message: 'Hasło musi mieć minimum 8 znaków' })
  @MaxLength(100, { message: 'Hasło może mieć maksymalnie 100 znaków' })
  password: string;
}
