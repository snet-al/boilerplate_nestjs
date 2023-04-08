import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty } from 'class-validator'

export class TokenPayloadDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly id: number

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  readonly email: string

  @ApiProperty()
  canAuthenticate?: boolean
}
