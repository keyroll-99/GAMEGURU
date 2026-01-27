import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoryElementType } from '@prisma/client';

export class CreateStoryElementDto {
  @ApiProperty({ example: 'uuid-of-project' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({ example: 'uuid-of-parent-element' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    enum: StoryElementType,
    example: StoryElementType.ACT,
  })
  @IsEnum(StoryElementType)
  type: StoryElementType;

  @ApiProperty({ example: 'Akt 1: Początek przygody' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: '# Opis sceny\n\nTreść w Markdown...' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: { age: 25, role: 'protagonist' } })
  @IsOptional()
  metadata?: Record<string, any>;
}
