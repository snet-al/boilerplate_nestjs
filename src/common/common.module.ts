import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { ExternalUserManagementService } from './services/external-user-management.service'
import { ExternalKeyClientService } from './services/external-key-client.service'

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [ExternalUserManagementService, ExternalKeyClientService],
  exports: [ExternalUserManagementService, ExternalKeyClientService],
})
export class CommonModule {}