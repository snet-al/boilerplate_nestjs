import { ApiProperty } from '@nestjs/swagger'
import { File } from '../../../entities/file.entity'

export class ResponseDocumentDto {
  @ApiProperty()
  public id: number

  @ApiProperty()
  protocolNumber: number

  @ApiProperty()
  fractionNumber: number

  @ApiProperty()
  receivedDate: Date

  @ApiProperty()
  subject: string

  @ApiProperty()
  senderId: number

  @ApiProperty()
  recipientId: number

  @ApiProperty()
  category: string

  @ApiProperty()
  unit: string

  @ApiProperty()
  conceptor: string

  @ApiProperty()
  delivery: object

  @ApiProperty()
  files: File[]
}
