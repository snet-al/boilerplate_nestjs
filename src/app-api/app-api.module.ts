import { Module } from '@nestjs/common'
import { ClientModule } from './client/client.module'
import { MessageModule } from './message/message.module'

@Module({
  imports: [ClientModule, MessageModule],
})
export class AppApiModule {}
