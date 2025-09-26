import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BasicEntity } from './basic.entity'
import { User } from './user.entity'

@Entity('analytics_user_summaries')
@Index(['userId', 'date'])
@Index(['date', 'model'])
export class AnalyticsUserSummary extends BasicEntity {
  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId: number

  @Column({ name: 'external_user_id', type: 'varchar', nullable: true })
  externalUserId: string

  @Column({ name: 'date', type: 'date' })
  date: string

  @Column({ name: 'model', type: 'varchar', nullable: true })
  model: string

  @Column({ name: 'model_group', type: 'varchar', nullable: true })
  modelGroup: string

  @Column({ name: 'custom_llm_provider', type: 'varchar', nullable: true })
  customLlmProvider: string

  @Column({ name: 'total_spend', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalSpend: number

  @Column({ name: 'total_tokens', type: 'integer', default: 0 })
  totalTokens: number

  @Column({ name: 'prompt_tokens', type: 'integer', default: 0 })
  promptTokens: number

  @Column({ name: 'completion_tokens', type: 'integer', default: 0 })
  completionTokens: number

  @Column({ name: 'successful_requests', type: 'integer', default: 0 })
  successfulRequests: number

  @Column({ name: 'failed_requests', type: 'integer', default: 0 })
  failedRequests: number

  @Column({ name: 'total_requests', type: 'integer', default: 0 })
  totalRequests: number

  @Column({ name: 'cache_read_input_tokens', type: 'integer', default: 0 })
  cacheReadInputTokens: number

  @Column({ name: 'cache_creation_input_tokens', type: 'integer', default: 0 })
  cacheCreationInputTokens: number

  @Column({ name: 'reasoning_tokens', type: 'integer', default: 0 })
  reasoningTokens: number

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User

  public get toResponse() {
    return {
      id: this.id,
      userId: this.userId,
      externalUserId: this.externalUserId,
      date: this.date,
      model: this.model,
      modelGroup: this.modelGroup,
      customLlmProvider: this.customLlmProvider,
      totalSpend: parseFloat(this.totalSpend.toString()),
      totalTokens: this.totalTokens,
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      totalRequests: this.totalRequests,
      cacheReadInputTokens: this.cacheReadInputTokens,
      cacheCreationInputTokens: this.cacheCreationInputTokens,
      reasoningTokens: this.reasoningTokens,
      user: this.user?.baseGroup,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}