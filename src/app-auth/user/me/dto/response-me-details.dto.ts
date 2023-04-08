import { ApiProperty } from '@nestjs/swagger'

export class ResponseMeDetailsDto {
  @ApiProperty()
  public id: number

  @ApiProperty()
  public name: string

  @ApiProperty()
  public email: string

  @ApiProperty()
  public phone: string

  @ApiProperty()
  public image: string
}
