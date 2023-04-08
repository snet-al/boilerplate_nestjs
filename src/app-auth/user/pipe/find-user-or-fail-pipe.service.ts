import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '../../../entities/user.entity'
import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common'

@Injectable()
export class FindUserOrFailPipeService implements PipeTransform<number, Promise<User>> {
  @InjectRepository(User)
  private repository: Repository<User>

  async transform(id: number): Promise<User> {
    const user = await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .where('user.id = :id', { id })
      .getOne()
    if (!user) {
      throw new NotFoundException(`The user with ID: ${id} was not found!`)
    }
    return user
  }
}
