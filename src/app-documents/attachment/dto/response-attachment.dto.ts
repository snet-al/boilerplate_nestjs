import { ApiProperty } from '@nestjs/swagger'
import { File } from '../../../entities/file.entity'

export class ResponseAttachmentDto {
  @ApiProperty()
  public id: number

  @ApiProperty()
  name: string

  @ApiProperty()
  extension: string

  @ApiProperty()
  path: string

  @ApiProperty()
  file: File
}
