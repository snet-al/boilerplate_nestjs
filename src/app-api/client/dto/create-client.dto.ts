import { ApiProperty } from '@nestjs/swagger'

export class CreateClientDto {
  @ApiProperty()
  companyName: string

  @ApiProperty()
  city: string

  @ApiProperty({ required: false })
  contactMethod?: string

  @ApiProperty({ required: false })
  notes?: string
}
