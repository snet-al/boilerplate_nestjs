import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { GroupService } from './group.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { File } from '../../entities/file.entity'
import { FileService } from '../file/file.service'
import { Group } from '../../entities/group.entity'
import { GroupsController } from './groups.controller'
import { Document } from '../../entities/document.entity'
import { Attachment } from '../../entities/attachment.entity'
import { DocumentService } from '../document/document.service'
import { PaginationService } from '../../common/pagination.service'
import { AttachmentService } from '../attachment/attachment.service'
import { DocumentsGroups } from '../../entities/documents_groups.entity'
import { FindGroupOrFailPipeService } from './pipe/find-group-or-fail-pipe.service'
import { FindDocumentOrFailPipeService } from '../document/pipe/find-document-or-fail-pipe.service'

@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([Group, DocumentsGroups, File, Attachment, Document])],
  controllers: [GroupsController],
  providers: [
    GroupService,
    PaginationService,
    FindGroupOrFailPipeService,
    FileService,
    AttachmentService,
    DocumentService,
    FindDocumentOrFailPipeService,
  ],
})
export class GroupModule {}
