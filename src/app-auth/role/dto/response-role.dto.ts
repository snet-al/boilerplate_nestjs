import { ApiProperty } from '@nestjs/swagger'

export class ResponseRoleDto {
  @ApiProperty()
  id?: number

  @ApiProperty()
  name: string

  @ApiProperty()
  permissions: string
}
