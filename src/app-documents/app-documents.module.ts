import { Module } from '@nestjs/common'
import { FileModule } from './file/file.module'
import { GroupModule } from './groups/group.module'
import { AttachmentModule } from './attachment/attachment.module'

@Module({
  imports: [FileModule, AttachmentModule, GroupModule],
})
export class AppDocumentsModule {}
