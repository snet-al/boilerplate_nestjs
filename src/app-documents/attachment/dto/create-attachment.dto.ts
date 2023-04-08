import { IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { File } from '../../../entities/file.entity'

export class CreateAttachmentDto {
  @ApiProperty()
  name: string

  @ApiProperty()
  extension: string

  @ApiProperty()
  file: File

  @ApiProperty()
  path: string

  @IsOptional()
  @ApiProperty()
  checksum?: string

  @IsOptional()
  @ApiProperty()
  filename?: string
}
