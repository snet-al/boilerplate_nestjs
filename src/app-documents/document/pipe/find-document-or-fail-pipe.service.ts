import { DocumentService } from '../document.service'
import { Document } from '../../../entities/document.entity'
import { Inject, Injectable, NotFoundException, PipeTransform } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class FindDocumentOrFailPipeService implements PipeTransform<number, Promise<Document>> {
  @InjectRepository(Document)
  public repository: Repository<Document>

  async transform(id: number): Promise<Document> {
    const document = await this.repository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.files', 'files')
      .leftJoinAndSelect('files.attachments', 'attachments')
      .where('document.id = :id', { id })
      .getOne()
    if (!document) {
      throw new NotFoundException(`Document with ID: ${id} not found!`)
    }
    return document
  }
}
