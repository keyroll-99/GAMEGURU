import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
    enum: ['leads_to', 'branches_to', 'requires'],
  })
  @IsString()
  @IsOptional()
  connectionType?: string;
}
