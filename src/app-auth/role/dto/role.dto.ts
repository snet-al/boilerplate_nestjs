import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export class RoleDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  id?: number

  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  permissions: string
}
