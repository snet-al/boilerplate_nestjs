import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Role } from '../../../entities/role.entity'
import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common'

@Injectable()
export class FindRoleOrFailPipeService implements PipeTransform<number, Promise<Role>> {
  @InjectRepository(Role)
  private repository: Repository<Role>

  async transform(id: number): Promise<Role> {
    const role = await this.repository.createQueryBuilder('role').where('role.id = :id', { id }).getOne()
    if (!role) {
      throw new NotFoundException(`This role with ID: ${id} was not found!`)
    }

    return role
  }
}
