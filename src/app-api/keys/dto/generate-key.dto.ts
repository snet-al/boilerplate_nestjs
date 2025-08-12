import { IsOptional, IsString, IsNumber, IsArray, IsBoolean, IsObject } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class GenerateKeyDto {
  @ApiProperty({ description: 'Alias/name for the key', example: 'my-api-key' })
  @IsString()
  key_alias: string

  @ApiPropertyOptional({ description: 'User ID (auto-populated by backend)' })
  @IsOptional()
  @IsString()
  user_id?: string

  @ApiPropertyOptional({ description: 'Team ID for team-level keys' })
  @IsOptional()
  @IsString()
  team_id?: string

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsOptional()
  @IsString()
  organization_id?: string

  @ApiPropertyOptional({ description: 'Maximum budget for the key' })
  @IsOptional()
  @IsNumber()
  max_budget?: number

  @ApiPropertyOptional({ description: 'Allowed models', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  models?: string[]

  @ApiPropertyOptional({ description: 'Allowed routes/endpoints', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_routes?: string[]

  @ApiPropertyOptional({ description: 'Key expiration date' })
  @IsOptional()
  @IsString()
  expires?: string

  @ApiPropertyOptional({ description: 'Whether key is blocked' })
  @IsOptional()
  @IsBoolean()
  blocked?: boolean

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>

  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}
