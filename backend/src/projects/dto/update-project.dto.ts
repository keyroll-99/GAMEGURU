import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Nazwa projektu nie może być pusta' })
  @MaxLength(255, {
    message: 'Nazwa projektu może mieć maksymalnie 255 znaków',
  })
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
