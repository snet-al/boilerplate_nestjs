import { Module } from '@nestjs/common'
import { ClientModule } from './client/client.module'
import { KeysModule } from './keys/keys.module'

@Module({
  imports: [ClientModule, KeysModule],
})
export class AppApiModule {}
