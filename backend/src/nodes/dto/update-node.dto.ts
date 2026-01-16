import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NodeStatus } from '@prisma/client';

export class UpdateNodeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(NodeStatus)
  @IsOptional()
  status?: NodeStatus;
}
