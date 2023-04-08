import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ClientService } from './client.service'
import { Client } from '../../entities/client.entity'
import { ClientsController } from './clients.controller'
import { PaginationService } from '../../common/pagination.service'

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  controllers: [ClientsController],
  providers: [ClientService, PaginationService],
})
export class ClientModule {}
