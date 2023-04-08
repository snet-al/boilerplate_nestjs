import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator'

export class UserDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  id?: number

  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  email: string

  @ApiProperty()
  @IsOptional()
  phone: string

  @ApiProperty()
  @IsOptional()
  password?: string

  @ApiProperty()
  @IsOptional()
  roleIds?: number[]

  @ApiProperty()
  @IsOptional()
  parentId?: number
}
