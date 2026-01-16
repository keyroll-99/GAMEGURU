import { IsUUID, IsInt, IsOptional, Min } from 'class-validator';

export class MoveNodeDto {
  @IsUUID()
  @IsOptional()
  newParentId?: string;

  @IsInt()
  @Min(0)
  newOrderIndex: number;
}
