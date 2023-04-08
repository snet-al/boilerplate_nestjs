import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Attachment } from '../../../entities/attachment.entity'
import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common'

@Injectable()
export class FindAttachmentOrFailPipeService implements PipeTransform<number, Promise<Attachment>> {
  @InjectRepository(Attachment)
  public repository: Repository<Attachment>

  async transform(id: number): Promise<Attachment> {
    const attachment = await this.repository.createQueryBuilder('attachment').where('attachment.id = :id', { id }).getOne()
    if (!attachment) {
      throw new NotFoundException('Attachment was not found!')
    }
    return attachment
  }
}
