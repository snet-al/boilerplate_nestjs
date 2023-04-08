import { Module } from '@nestjs/common'
import { MeService } from './me.service'
import { UsersModule } from '../user.module'
import { MeController } from './me.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PaginationService } from '../../../common/pagination.service'
import { FindUserOrFailPipeService } from '../pipe/find-user-or-fail-pipe.service'

@Module({
  imports: [TypeOrmModule.forFeature([]), UsersModule],
  controllers: [MeController],
  providers: [MeService, PaginationService, FindUserOrFailPipeService],
})
export class MeModule {}
