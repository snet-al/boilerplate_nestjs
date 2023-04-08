import { ApiProperty } from '@nestjs/swagger'

export class UpdateClientDto {
  @ApiProperty({ required: false })
  id?: number

  @ApiProperty({ required: false })
  companyName?: string

  @ApiProperty({ required: false })
  city?: string

  @ApiProperty({ required: false })
  contactMethod?: string

  @ApiProperty({ required: false })
  notes?: string
}
