import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StoryElementStatus } from '@prisma/client';

export class UpdateStoryElementDto {
  @ApiPropertyOptional({ example: 'Nowy tytuł' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Nowa treść...' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    enum: StoryElementStatus,
    example: StoryElementStatus.IN_PROGRESS,
  })
  @IsEnum(StoryElementStatus)
  @IsOptional()
  status?: StoryElementStatus;

  @ApiPropertyOptional({ example: { age: 30 } })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;
}
