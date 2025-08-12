import { IsString, IsArray, IsOptional, IsObject } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DeleteKeysDto {
  @ApiPropertyOptional({ description: 'Array of key tokens to delete', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keys?: string[]

  @ApiPropertyOptional({ description: 'Array of key aliases to delete', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  key_aliases?: string[]
}

export class UpdateKeyDto {
  @ApiProperty({ description: 'Key token or alias to update' })
  @IsString()
  key: string

  @ApiPropertyOptional({ description: 'New maximum budget' })
  @IsOptional()
  max_budget?: number

  @ApiPropertyOptional({ description: 'Block/unblock key' })
  @IsOptional()
  blocked?: boolean

  @ApiPropertyOptional({ description: 'Updated metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}

export class BlockKeyDto {
  @ApiProperty({ description: 'Key token to block' })
  @IsString()
  key: string
}

export class RegenerateKeyDto {
  @ApiPropertyOptional({ description: 'Additional parameters for regeneration' })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>
}
