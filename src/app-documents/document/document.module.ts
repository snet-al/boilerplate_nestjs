import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { File } from '../../entities/file.entity'
import { FileService } from '../file/file.service'
import { Group } from '../../entities/group.entity'
import { DocumentService } from './document.service'
import { GroupService } from '../groups/group.service'
import { Document } from '../../entities/document.entity'
import { DocumentsController } from './documents.controller'
import { Attachment } from '../../entities/attachment.entity'
import { PaginationService } from '../../common/pagination.service'
import { AttachmentService } from '../attachment/attachment.service'
import { DocumentsGroups } from '../../entities/documents_groups.entity'
import { FindDocumentOrFailPipeService } from './pipe/find-document-or-fail-pipe.service'
import { FindGroupOrFailPipeService } from '../groups/pipe/find-group-or-fail-pipe.service'

@Module({
  imports: [TypeOrmModule.forFeature([Document, File, Attachment, Group, DocumentsGroups])],
  controllers: [DocumentsController],
  providers: [
    DocumentService,
    GroupService,
    PaginationService,
    FindDocumentOrFailPipeService,
    FileService,
    FindGroupOrFailPipeService,
    AttachmentService,
    JwtService,
  ],
})
export class DocumentModule {}
