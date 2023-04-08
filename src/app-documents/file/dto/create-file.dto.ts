import { IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Attachment } from '../../../entities/attachment.entity'

export class CreateFileDto {
  @ApiProperty()
  data: object

  @ApiProperty()
  @IsOptional()
  status?: string

  @ApiProperty()
  @IsOptional()
  requestId?: number

  @ApiProperty()
  documentId: number

  @ApiProperty()
  attachments: Attachment[]

  @ApiProperty()
  @IsOptional()
  notes?: string

  @ApiProperty()
  @IsOptional()
  overallNotes?: string

  @ApiProperty()
  @IsOptional()
  tags?: string[]

  @ApiProperty()
  @IsOptional()
  filename?: string

  @ApiProperty()
  @IsOptional()
  originalName?: string
}
