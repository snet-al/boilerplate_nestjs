import { ApiProperty } from '@nestjs/swagger'

export class UserSpendingResponseDto {
  @ApiProperty({ description: 'Provider name (e.g., openai, anthropic)' })
  provider: string

  @ApiProperty({ description: 'Model name' })
  model: string

  @ApiProperty({ description: 'Total spending for this model' })
  totalSpend: number

  @ApiProperty({ description: 'Total tokens used' })
  totalTokens: number

  @ApiProperty({ description: 'Total requests made' })
  totalRequests: number
}