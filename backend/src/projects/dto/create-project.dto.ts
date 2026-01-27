import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1, { message: 'Nazwa projektu jest wymagana' })
  @MaxLength(255, {
    message: 'Nazwa projektu może mieć maksymalnie 255 znaków',
  })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
