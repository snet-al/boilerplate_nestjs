import { IsOptional, IsString, IsNumber, IsDateString, IsIn, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class AnalyticsFilterDto {
  @ApiProperty({ required: false, description: 'Filter by user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number

  @ApiProperty({ required: false, description: 'Filter by external user ID' })
  @IsOptional()
  @IsString()
  externalUserId?: string

  @ApiProperty({ required: false, description: 'Filter by model name (partial match)' })
  @IsOptional()
  @IsString()
  model?: string

  @ApiProperty({ required: false, description: 'Filter by provider name (partial match)' })
  @IsOptional()
  @IsString()
  provider?: string

  @ApiProperty({ required: false, description: 'Start date (ISO format)', example: '2025-08-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiProperty({ required: false, description: 'End date (ISO format)', example: '2025-08-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string

  @ApiProperty({ required: false, description: 'Filter by request status' })
  @IsOptional()
  @IsString()
  @IsIn(['success', 'failure'])
  status?: string

  @ApiProperty({ required: false, description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number

  @ApiProperty({ required: false, description: 'Number of items per page', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number
}