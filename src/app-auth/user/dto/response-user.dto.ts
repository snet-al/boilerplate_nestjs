import { ApiProperty } from '@nestjs/swagger'
import { UsersRoles } from '../../../entities/users_roles.entity'

export class ResponseUserDto {
  @ApiProperty()
  id: number

  @ApiProperty()
  name: string

  @ApiProperty()
  email: string

  @ApiProperty()
  status: string

  @ApiProperty()
  phone: string

  @ApiProperty()
  image: string

  @ApiProperty()
  isEmailVerified: boolean

  @ApiProperty()
  lastLogin: Date

  @ApiProperty()
  UsersRoles: UsersRoles[]
}
