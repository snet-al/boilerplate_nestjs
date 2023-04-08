import { Repository } from 'typeorm'
import { File } from '../../entities/file.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { FileService } from '../file/file.service'
import { Group } from '../../entities/group.entity'
import { Inject, Injectable } from '@nestjs/common'
import { Document } from '../../entities/document.entity'
import { CreateDocumentDto } from './dto/create-document.dto'
import { UpdateDocumentDto } from './dto/update-document.dto'
import { PaginationService } from '../../common/pagination.service'
import { DocumentsGroups } from '../../entities/documents_groups.entity'
import { UpdateAttachmentDto } from '../attachment/dto/update-attachment.dto'

@Injectable()
export class DocumentService {
  @Inject(PaginationService)
  private readonly paginationService: PaginationService

  @InjectRepository(Document)
  public repository: Repository<Document>

  @InjectRepository(DocumentsGroups)
  public documentsGroupsRepository: Repository<DocumentsGroups>

  @InjectRepository(File)
  public fileRepository: Repository<File>

  @Inject(FileService)
  private readonly fileService: FileService

  async create(createDocumentDto: CreateDocumentDto, uploadedFile: Express.Multer.File, group?: Group): Promise<Document> {
    const newDocument = this.repository.create(createDocumentDto)
    const savedDocument = await this.repository.save(newDocument)

    if (group) {
      let documentFolder = this.documentsGroupsRepository.create({
        documentId: savedDocument.id,
        groupId: group.id,
      })
      documentFolder = await this.documentsGroupsRepository.save(documentFolder)
    }

    const createFileDto = {
      data: {},
      documentId: savedDocument.id,
      attachments: [],
      status: createDocumentDto.status,
      requestId: createDocumentDto.requestId,
      notes: createDocumentDto.notes,
      overallNotes: createDocumentDto.overallNotes,
      tags: createDocumentDto.tags,
      filename: createDocumentDto.filename,
      originalName: uploadedFile.originalname,
    }

    await this.fileService.create(createFileDto, uploadedFile, group)

    return savedDocument
  }

  async findAll(request: Request) {
    const query = this.paginationService.paginate({}, request)
    return this.repository.findAndCount(query)
  }

  findOne(id: number, relations?: string[]) {
    return this.repository.findOne({
      where: {
        id,
      },
      ...(relations && { relations }),
    })
  }

  async update(document: Document, updateDocumentDto: UpdateDocumentDto) {
    document = this.repository.merge(document, updateDocumentDto)
    document = await this.repository.save(document)
    return document
  }

  async remove(document: Document) {
    const files = await this.fileRepository.createQueryBuilder('f').where('f.documentId = :documentId', { documentId: document.id }).getMany()
    for (const file of files) {
      await this.fileService.remove(file)
    }
    return await this.repository.softRemove(document)
  }

  async rename(document: Document, updateDto: UpdateAttachmentDto) {
    const files = await this.fileRepository.createQueryBuilder('f').where('f.documentId = :documentId', { documentId: document.id }).getMany()
    for (const file of files) {
      await this.fileService.rename(file, updateDto)
    }
  }
}
