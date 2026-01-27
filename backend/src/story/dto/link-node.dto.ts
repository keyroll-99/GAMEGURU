import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkNodeDto {
  @ApiProperty({ example: 'uuid-of-node' })
  @IsUUID()
  @IsNotEmpty()
  nodeId: string;
}
