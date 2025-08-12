import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { KeysService } from './keys.service'
import { KeysController } from './keys.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApiKey } from '../../entities/api_key.entity'
import { User } from '../../entities/user.entity'
import { CommonModule } from '../../common/common.module'
import { KeyProcessingHelper } from './helpers/key-processing.helper'
import { UserAuthHelper } from './helpers/user-auth.helper'

@Module({
  imports: [HttpModule, ConfigModule, TypeOrmModule.forFeature([ApiKey, User]), CommonModule],
  controllers: [KeysController],
  providers: [KeysService, KeyProcessingHelper, UserAuthHelper],
  exports: [KeysService, KeyProcessingHelper, UserAuthHelper],
})
export class KeysModule {}


