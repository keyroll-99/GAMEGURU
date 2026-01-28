import { IsString, IsNumber, IsArray, IsOptional, Min, Max } from 'class-validator'

export class SaveViewStateDto {
  @IsString()
  projectId: string

  @IsOptional()
  @IsString()
  viewType?: string

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(5)
  zoom?: number

  @IsOptional()
  @IsNumber()
  panX?: number

  @IsOptional()
  @IsNumber()
  panY?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expandedNodes?: string[]
}
