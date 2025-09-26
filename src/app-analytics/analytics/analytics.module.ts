import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HttpModule } from '@nestjs/axios'
import { AnalyticsController } from './analytics.controller'
import { AnalyticsService } from './analytics.service'
import { AnalyticsRequestLog } from '../../entities/analytics_request_log.entity'
import { AnalyticsUserSummary } from '../../entities/analytics_user_summary.entity'
import { User } from '../../entities/user.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsRequestLog, AnalyticsUserSummary, User]),
    HttpModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}