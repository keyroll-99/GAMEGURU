import { IsArray, IsUUID } from 'class-validator';

export class ReorderChildrenDto {
  @IsArray()
  @IsUUID('4', { each: true })
  childrenIds: string[];
}
