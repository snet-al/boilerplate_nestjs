import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { UserBudget } from '../entities/user_budget.entity'
import { AnalyticsUserSummary } from '../entities/analytics_user_summary.entity'
import { AnalyticsRequestLog } from '../entities/analytics_request_log.entity'
import { AnalyticsService } from '../app-analytics/analytics/analytics.service'
import { LitellmClientService } from '../common/services/litellm-client.service'

interface BudgetView {
  user_id: number
  spend_usd: number
  max_budget_usd: number
  remaining_usd: number
  period_start: string
  period_end: string
  next_reset_at: string | null
  soft_budget_usd: number | null
}

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name)

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserBudget) private readonly budgetRepo: Repository<UserBudget>,
    @InjectRepository(AnalyticsUserSummary) private readonly summaryRepo: Repository<AnalyticsUserSummary>,
    @InjectRepository(AnalyticsRequestLog) private readonly logsRepo: Repository<AnalyticsRequestLog>,
    private readonly analyticsService: AnalyticsService,
    private readonly litellm: LitellmClientService,
  ) {}

  private getRollingWindowAnchors(anchor: Date | null, period: string): { start: Date; end: Date; nextResetAt: Date | null } {
    const now = new Date()
    const end = now
    let start = new Date(now)
    let nextResetAt: Date | null = null

    // For now only support 1mo rolling; easy to extend
    if (period === '1mo' || period === '30d') {
      start = new Date(now)
      start.setMonth(now.getMonth() - 1)
      if (anchor) {
        // next_reset_at = anchor advanced by whole months until it's in the future
        const n = new Date(anchor)
        while (n <= now) {
          n.setMonth(n.getMonth() + 1)
        }
        nextResetAt = n
      } else {
        nextResetAt = null
      }
    } else if (period.endsWith('d')) {
      const days = parseInt(period)
      start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    } else {
      // default fallback: 1 month
      start.setMonth(now.getMonth() - 1)
    }

    return { start, end, nextResetAt }
  }

  private async ensureBudgetRow(userId: number): Promise<UserBudget> {
    let row = await this.budgetRepo.findOne({ where: { userId } })
    if (!row) {
      row = this.budgetRepo.create({
        userId,
        maxBudgetUsd: 5.0,
        budgetPeriod: '1mo',
        softBudgetUsd: 4.0,
        periodAnchor: new Date(),
        nextResetAt: null,
        lastKnownSpendUsd: 0,
      })
      row = await this.budgetRepo.save(row)
    }
    return row
  }

  async getMyBudget(userId: number): Promise<BudgetView> {
    let budget: UserBudget
    try {
      budget = await this.ensureBudgetRow(userId)
    } catch (e: any) {
      this.logger.error(`ensureBudgetRow failed: ${e?.message || e}`)
      // Return a safe default view when DB is not ready
      const now = new Date()
      const start = new Date(now)
      start.setMonth(now.getMonth() - 1)
      return {
        user_id: userId,
        spend_usd: 0,
        max_budget_usd: 5,
        remaining_usd: 5,
        period_start: start.toISOString(),
        period_end: now.toISOString(),
        next_reset_at: null,
        soft_budget_usd: 4,
      }
    }

    // Compute window
    const { start, end, nextResetAt } = this.getRollingWindowAnchors(budget.periodAnchor, budget.budgetPeriod)

    // Prefer summaries for fast aggregation, fallback to logs if needed
    const qb = this.summaryRepo.createQueryBuilder('s')
      .select('COALESCE(SUM(s.totalSpend), 0)', 'spend')
      .where('s.userId = :userId', { userId })
      .andWhere('s.date BETWEEN :startDate AND :endDate', {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      })

    let spendUsd = 0
    try {
      const res = await qb.getRawOne<{ spend: string }>()
      spendUsd = parseFloat(res?.spend || '0')
    } catch (e: any) {
      this.logger.warn(`Summary query failed, falling back to logs: ${e?.message || e}`)
    }

    if (!isFinite(spendUsd) || spendUsd === 0) {
      // fallback to logs if summaries empty
      const logsQb = this.logsRepo.createQueryBuilder('l')
        .select('COALESCE(SUM(l.spend), 0)', 'spend')
        .where('l.userId = :userId', { userId })
        .andWhere('l.startTime BETWEEN :start AND :end', { start, end })
      try {
        const logsRes = await logsQb.getRawOne<{ spend: string }>()
        spendUsd = parseFloat(logsRes?.spend || '0')
      } catch (e: any) {
        this.logger.warn(`Logs query failed: ${e?.message || e}`)
        spendUsd = 0
      }
    }

    // Update cache fields
    budget.lastKnownSpendUsd = spendUsd
    budget.lastRefreshAt = new Date()
    budget.nextResetAt = nextResetAt
    try { await this.budgetRepo.save(budget) } catch (_) {}

    const maxBudget = typeof budget.maxBudgetUsd === 'number' ? budget.maxBudgetUsd : parseFloat(budget.maxBudgetUsd as any)
    const remaining = Math.max(0, maxBudget - spendUsd)

    return {
      user_id: userId,
      spend_usd: +spendUsd.toFixed(6),
      max_budget_usd: +maxBudget,
      remaining_usd: +remaining,
      period_start: start.toISOString(),
      period_end: end.toISOString(),
      next_reset_at: nextResetAt ? nextResetAt.toISOString() : null,
      soft_budget_usd: budget.softBudgetUsd === null || budget.softBudgetUsd === undefined ? null : parseFloat(budget.softBudgetUsd as any),
    }
  }

  async refreshMyBudget(userId: number): Promise<BudgetView> {
    // 1) Sync latest analytics first (like analytics refresh)
    try {
      await Promise.all([
        this.analyticsService.fetchAndSyncSpendLogs(undefined, undefined, userId),
        this.analyticsService.fetchAndSyncUserAnalytics(undefined, undefined, userId),
      ])
    } catch (e) {
      this.logger.warn(`Analytics sync failed during budget refresh: ${e?.message || e}`)
    }

    // 2) Optional reconciliation with proxy user spend (if external_user_id present)
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } })
      const externalId = user?.externalUserId
      if (externalId) {
        const info = await this.litellm.userInfo(externalId)
        const proxySpend = parseFloat(info?.user_info?.spend || '0')
        if (!isNaN(proxySpend) && proxySpend >= 0) {
          // Store latest known proxy spend for visibility (does not override DB aggregation)
          await this.budgetRepo.update({ userId }, { lastKnownSpendUsd: proxySpend, lastRefreshAt: new Date() })
        }
      }
    } catch (e) {
      this.logger.warn(`Proxy reconciliation failed: ${e?.message || e}`)
    }

    // 3) Recompute from DB
    return this.getMyBudget(userId)
  }
}


