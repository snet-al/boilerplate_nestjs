import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { File } from '../../../entities/file.entity'
import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common'

@Injectable()
export class FindFileOrFailPipeService implements PipeTransform<number, Promise<File>> {
  @InjectRepository(File)
  public repository: Repository<File>

  async transform(id: number): Promise<File> {
    const file = await this.repository.createQueryBuilder('file').where('file.id = :id', { id }).getOne()
    if (!file) {
      throw new NotFoundException(`File with ID: ${id} not found`)
    }
    return file
  }
}
