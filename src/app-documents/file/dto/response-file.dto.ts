import { ApiProperty } from '@nestjs/swagger'
import { Document } from '../../../entities/document.entity'
import { Attachment } from '../../../entities/attachment.entity'

export class ResponseFileDto {
  @ApiProperty()
  public id: number

  @ApiProperty()
  data: object

  @ApiProperty()
  document: Document

  @ApiProperty()
  attachments: Attachment[]
}
