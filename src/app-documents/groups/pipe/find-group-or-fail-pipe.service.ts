import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Group } from '../../../entities/group.entity'
import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common'

@Injectable()
export class FindGroupOrFailPipeService implements PipeTransform<number, Promise<Group>> {
  @InjectRepository(Group)
  public repository: Repository<Group>

  async transform(id: number): Promise<Group> {
    const group = await this.repository.findOne({
      where: { id },
      relations: ['parent', 'parent.parent', 'parent.parent.parent', 'parent.parent.parent.parent', 'parent.parent.parent.parent.parent'],
    })
    if (!group) {
      throw new NotFoundException(`Group with ID: ${id} was not found!`)
    }

    return group
  }
}
