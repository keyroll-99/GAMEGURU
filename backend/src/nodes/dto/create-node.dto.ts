import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NodeType } from '@prisma/client';

export class CreateNodeDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsEnum(NodeType)
  @IsOptional()
  type?: NodeType;

  @IsString()
  @IsOptional()
  description?: string;
}
