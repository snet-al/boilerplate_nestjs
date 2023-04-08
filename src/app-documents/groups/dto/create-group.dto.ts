import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { FolderDetailsDto } from './folder-details.dto'
import { IsArray, IsOptional, ValidateNested } from 'class-validator'

export class CreateGroupDto {
  @ApiProperty()
  @IsOptional()
  id: number

  @ApiProperty()
  @IsOptional()
  parentId: number

  @ApiProperty()
  @IsOptional()
  parentName: string

  @ApiProperty()
  @IsOptional()
  parents: string

  @ApiProperty()
  @IsOptional()
  nr: string

  @ApiProperty()
  @IsOptional()
  level: number

  @ApiProperty()
  @IsOptional()
  type: string

  @ApiProperty()
  @IsOptional()
  title: string

  @ApiProperty()
  @IsOptional()
  location: string

  @ApiProperty()
  @IsOptional()
  description: string

  @ApiProperty()
  @IsOptional()
  isPublic: boolean

  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FolderDetailsDto)
  folderDetails: FolderDetailsDto[]
}
