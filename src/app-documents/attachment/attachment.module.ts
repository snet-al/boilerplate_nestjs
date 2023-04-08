import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AttachmentService } from './attachment.service'
import { Attachment } from '../../entities/attachment.entity'
import { AttachmentsController } from './attachments.controller'
import { PaginationService } from '../../common/pagination.service'
import { FindAttachmentOrFailPipeService } from './pipe/find-attachment-or-fail-pipe.service'

@Module({
  imports: [TypeOrmModule.forFeature([Attachment])],
  controllers: [AttachmentsController],
  providers: [AttachmentService, PaginationService, FindAttachmentOrFailPipeService],
})
export class AttachmentModule {}
