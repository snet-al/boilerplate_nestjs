import * as fs from 'fs'
import { Repository } from 'typeorm'
import { degrees, PDFDocument } from 'pdf-lib'
import { File } from '../../entities/file.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Group } from '../../entities/group.entity'
import { CreateFileDto } from './dto/create-file.dto'
import { UpdateFileDto } from './dto/update-file.dto'
import { Attachment } from '../../entities/attachment.entity'
import { PaginationService } from '../../common/pagination.service'
import { AttachmentService } from '../attachment/attachment.service'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DocumentsGroups } from '../../entities/documents_groups.entity'
import { UpdateAttachmentDto } from '../attachment/dto/update-attachment.dto'

@Injectable()
export class FileService {
  @Inject(PaginationService)
  private readonly paginationService: PaginationService

  @Inject(AttachmentService)
  private readonly attachmentService: AttachmentService

  @InjectRepository(File)
  public repository: Repository<File>

  @InjectRepository(DocumentsGroups)
  public documentsGroupsRepository: Repository<DocumentsGroups>

  @InjectRepository(Attachment)
  public attachmentRepository: Repository<Attachment>

  async create(createFileDto: CreateFileDto, uploadedFile: Express.Multer.File = null, group?: Group): Promise<File> {
    const newFile = this.repository.create(createFileDto)
    const savedFile = await this.repository.save(newFile)

    let path = `${process.cwd()}/public/uploads/${uploadedFile.filename}`
    const splitedArray = uploadedFile.filename.split('.')
    const splitedName = splitedArray.slice(0, splitedArray.length - 1)

    let createAttachmentDto = {
      file: savedFile,
      name: splitedName.join('.'),
      extension: splitedArray[splitedArray.length - 1],
      path,
      filename: createFileDto.filename,
      originalName: createFileDto.originalName,
    }

    await this.attachmentService.create(createAttachmentDto)
    return savedFile
  }

  async findAll(request: Request) {
    const query = this.paginationService.paginate({}, request)
    return this.repository.findAndCount(query)
  }

  async findEverything() {
    return this.repository.findAndCount()
  }

  async findOne(id: number) {
    const response = await this.repository.findOne({
      where: {
        id,
      },
    })
    return response
  }

  async update(file: File, updateFileDto: UpdateFileDto) {
    file = this.repository.merge(file, updateFileDto)
    file = await this.repository.save(file)
    return file
  }

  async remove(file: File) {
    const attachments = await this.attachmentRepository.createQueryBuilder('a').where('a.fileId = :fileId', { fileId: file.id }).getMany()
    for (const attachment of attachments) {
      await this.attachmentService.remove(attachment)
    }

    return await this.repository.softRemove(file)
  }

  async findByName(name: string, group: Group) {
    const file = await this.repository.createQueryBuilder('f').leftJoinAndSelect('f.attachments', 'a').where('a.name = :name', { name }).getOne()
    if (file) {
      const isFileInGroup = await this.documentsGroupsRepository
        .createQueryBuilder('df')
        .where('df.document_id = :documentId AND df.group_id = :groupId', { documentId: file.documentId, groupId: group.id })
        .getOne()

      if (!isFileInGroup) {
        throw new NotFoundException('Document not found in this group')
      }
      return file
    } else {
      throw new NotFoundException('Document not found')
    }
  }

  async rename(file: File, updateDto: UpdateAttachmentDto) {
    const attachments = await this.attachmentRepository.createQueryBuilder('a').where('a.fileId = :fileId', { fileId: file.id }).getMany()
    for (const attachment of attachments) {
      await this.attachmentService.rename(attachment, updateDto)
    }
  }

  async addWatermark(path: string) {
    const pdfDoc = fs.readFileSync(path)
    const pdfDocument = await PDFDocument.load(pdfDoc)
    const pdfPages = pdfDocument.getPages()

    for (const page of pdfPages) {
      console.log('page', page)
      page.drawText('Watermark', {
        x: 150,
        opacity: 0.2,
        rotate: degrees(45),
        y: 200,
        size: 120,
      })
    }

    const fileBuffer = await pdfDocument.save()
    fs.writeFileSync(path, fileBuffer)
  }
}
