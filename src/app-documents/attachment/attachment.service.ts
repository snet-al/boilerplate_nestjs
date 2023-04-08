import { Inject, Injectable, StreamableFile } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { createReadStream } from 'fs'
import { Repository } from 'typeorm'
import { PaginationService } from '../../common/pagination.service'
import { Attachment } from '../../entities/attachment.entity'
import { CreateAttachmentDto } from './dto/create-attachment.dto'
import { UpdateAttachmentDto } from './dto/update-attachment.dto'
import * as fs from 'fs'
import * as crypto from 'crypto'

@Injectable()
export class AttachmentService {
  @Inject(PaginationService)
  private readonly paginationService: PaginationService
  @InjectRepository(Attachment)
  public repository: Repository<Attachment>

  async create(createAttachmentDto: CreateAttachmentDto): Promise<Attachment> {
    fs.readFile(createAttachmentDto.path, function (err, data) {
      createAttachmentDto.checksum = crypto.createHash('sha1').update(data).digest('hex')
    })
    const newAttachment = this.repository.create(createAttachmentDto)
    const savedAttachment = await this.repository.save(newAttachment)
    return savedAttachment
  }

  async findAll(request: Request) {
    const queryBuilder = this.repository.createQueryBuilder('a')
    await this.paginationService.paginateQueryBuilder(queryBuilder, request)
    const results = await queryBuilder.getManyAndCount()
    const items = results[0].map((application) => application.toResponse)
    const totalRecords = results[1] || 0
    return { items, totalRecords }
  }

  findOne(id: number) {
    return this.repository.findOne({
      where: {
        id,
      },
    })
  }

  async update(attachment: Attachment, updateAttachmentDto: UpdateAttachmentDto) {
    const mergedAttachment = this.repository.merge(attachment, updateAttachmentDto)
    const updatedAttachment = await this.repository.save(mergedAttachment)
    return updatedAttachment
  }

  async remove(attachment: Attachment) {
    return await this.repository.softRemove(attachment)
  }

  getUploadedAttachment(attachment: Attachment) {
    const uploadedAttachment = createReadStream(attachment.path)
    return new StreamableFile(uploadedAttachment)
  }

  async rename(attachment: Attachment, updateDto: UpdateAttachmentDto) {
    let newPath = `${process.cwd()}/public/uploads/${updateDto.name}.${attachment.extension}`
    updateDto.path = newPath

    fs.rename(attachment.path, newPath, function (err) {
      if (err) throw err
    })
    return await this.update(attachment, updateDto)
  }
}
