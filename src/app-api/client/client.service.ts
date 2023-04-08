import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Injectable, Inject } from '@nestjs/common'
import { Client } from '../../entities/client.entity'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { PaginationService } from '../../common/pagination.service'

@Injectable()
export class ClientService {
  @Inject(PaginationService)
  public paginationService: PaginationService

  @InjectRepository(Client)
  private repository: Repository<Client>

  async findAll(request: Request) {
    const queryBuilder = this.repository.createQueryBuilder('client')
    await this.paginationService.paginateQueryBuilder(queryBuilder, request)
    const results = await queryBuilder.getManyAndCount()
    const items = results[0].map((client) => client.baseGroup)
    const totalRecords = results[1] || 0
    return { items, totalRecords }
  }

  async create(createClientDto: CreateClientDto): Promise<Client> {
    let newClient = this.repository.create(createClientDto)
    let savedClient = await this.repository.save(newClient)
    return savedClient
  }

  findOne(id: number) {
    return this.repository.createQueryBuilder('client').where('client.id = :id', { id }).getOne()
  }

  async update(client: Client, updateClientDto: UpdateClientDto) {
    client = this.repository.merge(client, updateClientDto)
    client = await this.repository.save(client)
    return client
  }

  remove(client: Client) {
    return this.repository.softDelete(client.id)
  }
}
