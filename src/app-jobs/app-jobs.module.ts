import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JobsService } from './jobs.service'

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [JobsService],
})
export class AppJobsModule {}
