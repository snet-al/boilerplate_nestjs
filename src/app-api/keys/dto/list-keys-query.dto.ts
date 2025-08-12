import { IsOptional, IsString, IsNumber, IsBoolean, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class ListKeysQueryDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number

  @ApiPropertyOptional({ description: 'Page size', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  size?: number

  @ApiPropertyOptional({ description: 'User ID filter (auto-populated)' })
  @IsOptional()
  @IsString()
  user_id?: string

  @ApiPropertyOptional({ description: 'Team ID filter' })
  @IsOptional()
  @IsString()
  team_id?: string

  @ApiPropertyOptional({ description: 'Organization ID filter' })
  @IsOptional()
  @IsString()
  organization_id?: string

  @ApiPropertyOptional({ description: 'Key hash filter' })
  @IsOptional()
  @IsString()
  key_hash?: string

  @ApiPropertyOptional({ description: 'Key alias filter' })
  @IsOptional()
  @IsString()
  key_alias?: string

  @ApiPropertyOptional({ description: 'Return full object details' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  return_full_object?: boolean

  @ApiPropertyOptional({ description: 'Include team keys' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_team_keys?: boolean

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sort_by?: string

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc'
}
