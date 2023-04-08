import { IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class FolderDetailsDto {
  @ApiProperty()
  @IsOptional()
  id: number

  @ApiProperty()
  @IsOptional()
  type: string

  @ApiProperty()
  @IsOptional()
  table: string

  @ApiProperty()
  @IsOptional()
  nr: string

  @ApiProperty()
  @IsOptional()
  name: string

  @ApiProperty()
  @IsOptional()
  date: string

  @ApiProperty()
  @IsOptional()
  pagesAmount: string

  @ApiProperty()
  @IsOptional()
  conclusion: string

  @ApiProperty()
  @IsOptional()
  fullname: string

  @ApiProperty()
  @IsOptional()
  grade: string

  @ApiProperty()
  @IsOptional()
  reasons: string

  @ApiProperty()
  @IsOptional()
  personalFolderNr: string

  @ApiProperty()
  @IsOptional()
  category: string

  @ApiProperty()
  @IsOptional()
  changes: string

  @ApiProperty()
  @IsOptional()
  pagesNumber: string

  @ApiProperty()
  @IsOptional()
  remarks: string

  @ApiProperty()
  @IsOptional()
  eventType: string

  @ApiProperty()
  @IsOptional()
  place: string

  @ApiProperty()
  @IsOptional()
  damageValue: string

  @ApiProperty()
  @IsOptional()
  cause: string

  @ApiProperty()
  @IsOptional()
  personWhoCaused: string

  @ApiProperty()
  @IsOptional()
  precautions: string

  @ApiProperty()
  @IsOptional()
  ordinalNr: string

  @ApiProperty()
  @IsOptional()
  responsability: string

  @ApiProperty()
  @IsOptional()
  knownPage: string

  @ApiProperty()
  @IsOptional()
  signature: string

  @ApiProperty()
  @IsOptional()
  branch: string

  @ApiProperty()
  @IsOptional()
  politicalAttitude: string

  @ApiProperty()
  @IsOptional()
  idNumber: string

  @ApiProperty()
  @IsOptional()
  residence: string

  @ApiProperty()
  @IsOptional()
  relationship: string

  @ApiProperty()
  @IsOptional()
  actionsType: string
}
