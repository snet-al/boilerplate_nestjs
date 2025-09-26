import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HttpModule } from '@nestjs/axios'
import { BudgetService } from './budget.service'
import { BudgetController } from './budget.controller'
import { User } from '../entities/user.entity'
import { UserBudget } from '../entities/user_budget.entity'
import { AnalyticsRequestLog } from '../entities/analytics_request_log.entity'
import { AnalyticsUserSummary } from '../entities/analytics_user_summary.entity'
import { AnalyticsModule } from '../app-analytics/analytics/analytics.module'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserBudget, AnalyticsRequestLog, AnalyticsUserSummary]),
    HttpModule,
    AnalyticsModule,
    CommonModule,
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}


