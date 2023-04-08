import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Client } from '../../../entities/client.entity'
import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common'

@Injectable()
export class FindClientOrFailPipeService implements PipeTransform<number, Promise<Client>> {
  @InjectRepository(Client)
  private repository: Repository<Client>

  async transform(id: number): Promise<Client> {
    const client = await this.repository.createQueryBuilder('client').where('client.id = :id', { id }).getOne()
    if (!client) {
      throw new NotFoundException(`The client with ID: ${id} was not found!`)
    }
    return client
  }
}
