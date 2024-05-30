import { ApiProperty } from '@nestjs/swagger'

export class CreateMessageDto {
  @ApiProperty()
  public userId: string

  @ApiProperty()
  public debateId: string

  @ApiProperty()
  public type: string

  @ApiProperty()
  public message: string
}
