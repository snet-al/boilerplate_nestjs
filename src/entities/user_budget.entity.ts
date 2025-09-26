import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BasicEntity } from './basic.entity'
import { User } from './user.entity'

@Entity('user_budget')
@Index(['userId'], { unique: true })
export class UserBudget extends BasicEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'max_budget_usd', type: 'decimal', precision: 10, scale: 2, default: 5.0 })
  maxBudgetUsd: number

  @Column({ name: 'budget_period', type: 'varchar', length: 20, default: '1mo' })
  budgetPeriod: string

  @Column({ name: 'soft_budget_usd', type: 'decimal', precision: 10, scale: 2, nullable: true })
  softBudgetUsd: number | null

  @Column({ name: 'model_max_budget', type: 'json', nullable: true })
  modelMaxBudget: Record<string, any> | null

  @Column({ name: 'period_anchor', type: 'timestamp', nullable: true })
  periodAnchor: Date | null

  @Column({ name: 'next_reset_at', type: 'timestamp', nullable: true })
  nextResetAt: Date | null

  @Column({ name: 'proxy_synced_at', type: 'timestamp', nullable: true })
  proxySyncedAt: Date | null

  @Column({ name: 'last_known_spend_usd', type: 'decimal', precision: 10, scale: 8, default: 0 })
  lastKnownSpendUsd: number

  @Column({ name: 'last_refresh_at', type: 'timestamp', nullable: true })
  lastRefreshAt: Date | null

  public get toResponse() {
    return {
      userId: this.userId,
      maxBudgetUsd: typeof this.maxBudgetUsd === 'number' ? this.maxBudgetUsd : parseFloat(this.maxBudgetUsd as any),
      budgetPeriod: this.budgetPeriod,
      softBudgetUsd: this.softBudgetUsd === null || this.softBudgetUsd === undefined ? null : parseFloat(this.softBudgetUsd as any),
      modelMaxBudget: this.modelMaxBudget,
      periodAnchor: this.periodAnchor,
      nextResetAt: this.nextResetAt,
      proxySyncedAt: this.proxySyncedAt,
      lastKnownSpendUsd: typeof this.lastKnownSpendUsd === 'number' ? this.lastKnownSpendUsd : parseFloat(this.lastKnownSpendUsd as any),
      lastRefreshAt: this.lastRefreshAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}


