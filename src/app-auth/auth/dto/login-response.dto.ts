import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { ValidateNested } from 'class-validator'

class UserDto {
  @ApiProperty()
  readonly name: string

  @ApiProperty()
  readonly email: string

  @ApiProperty()
  readonly isFirstTimeLogin: boolean

  @ApiProperty()
  readonly role: string
}

export class LoginResponseDto {
  @ApiProperty()
  token: string

  @ApiProperty()
  @Type(() => UserDto)
  @ValidateNested()
  readonly user: UserDto
}
