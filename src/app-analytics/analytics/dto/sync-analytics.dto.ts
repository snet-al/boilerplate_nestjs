import { IsOptional, IsDateString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SyncAnalyticsDto {
  @ApiProperty({ 
    required: false, 
    description: 'Start date for syncing (ISO format)', 
    example: '2025-08-01' 
  })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiProperty({ 
    required: false, 
    description: 'End date for syncing (ISO format)', 
    example: '2025-08-31' 
  })
  @IsOptional()
  @IsDateString()
  endDate?: string
}