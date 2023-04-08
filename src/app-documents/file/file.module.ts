import { Module } from '@nestjs/common'
import { FileService } from './file.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { File } from '../../entities/file.entity'
import { Group } from '../../entities/group.entity'
import { FilesController } from './files.controller'
import { GroupService } from '../groups/group.service'
import { Attachment } from '../../entities/attachment.entity'
import { PaginationService } from '../../common/pagination.service'
import { AttachmentService } from '../attachment/attachment.service'
import { DocumentsGroups } from '../../entities/documents_groups.entity'
import { FindFileOrFailPipeService } from './pipe/find-file-or-fail-pipe.service'
import { FindGroupOrFailPipeService } from '../groups/pipe/find-group-or-fail-pipe.service'
import { FindAttachmentOrFailPipeService } from '../attachment/pipe/find-attachment-or-fail-pipe.service'

@Module({
  imports: [TypeOrmModule.forFeature([File, Attachment, Group, DocumentsGroups])],
  controllers: [FilesController],
  providers: [
    FileService,
    GroupService,
    AttachmentService,
    PaginationService,
    FindFileOrFailPipeService,
    FindAttachmentOrFailPipeService,
    FindGroupOrFailPipeService,
  ],
})
export class FileModule {}
