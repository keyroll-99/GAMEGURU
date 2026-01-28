import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RollbackStoryDto {
  @ApiProperty({
    description: 'ID wpisu historii do przywrócenia',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  historyId: string;
}
