import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const CONNECTION_TYPES = ['leads_to', 'branches_to', 'requires'] as const;

export class CreateConnectionDto {
  @ApiProperty({ example: 'uuid-of-target-element' })
  @IsUUID()
  @IsNotEmpty()
  toElementId: string;

  @ApiPropertyOptional({ example: 'Jeśli gracz wybierze opcję A' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({
    example: 'leads_to',
    enum: CONNECTION_TYPES,
  })
  @IsIn(CONNECTION_TYPES)
  @IsOptional()
  connectionType?: string;
}
