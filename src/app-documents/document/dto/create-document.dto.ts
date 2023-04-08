import { IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Group } from '../../../entities/group.entity'
import { File } from '../../../entities/file.entity'

export class CreateDocumentDto {
  @ApiProperty()
  files: File[]

  @ApiProperty()
  groups: Group[]

  @ApiProperty()
  @IsOptional()
  status?: string

  @ApiProperty()
  @IsOptional()
  requestId?: number

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
