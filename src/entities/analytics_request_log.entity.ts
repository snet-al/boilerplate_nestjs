import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BasicEntity } from './basic.entity'
import { User } from './user.entity'

@Entity('analytics_request_logs')
@Index(['userId', 'model', 'startTime'])
@Index(['requestId'], { unique: true })
export class AnalyticsRequestLog extends BasicEntity {
  @Column({ name: 'request_id', type: 'varchar', unique: true })
  requestId: string

  @Column({ name: 'call_type', type: 'varchar' })
  callType: string

  @Column({ name: 'api_key_hash', type: 'varchar' })
  apiKeyHash: string

  @Column({ name: 'spend', type: 'decimal', precision: 20, scale: 8 })
  spend: number

  @Column({ name: 'total_tokens', type: 'integer' })
  totalTokens: number

  @Column({ name: 'prompt_tokens', type: 'integer' })
  promptTokens: number

  @Column({ name: 'completion_tokens', type: 'integer' })
  completionTokens: number

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date

  @Column({ name: 'completion_start_time', type: 'timestamp', nullable: true })
  completionStartTime: Date

  @Column({ name: 'model', type: 'varchar' })
  model: string

  @Column({ name: 'model_id', type: 'varchar', nullable: true })
  modelId: string

  @Column({ name: 'model_group', type: 'varchar', nullable: true })
  modelGroup: string

  @Column({ name: 'custom_llm_provider', type: 'varchar' })
  customLlmProvider: string

  @Column({ name: 'api_base', type: 'varchar', nullable: true })
  apiBase: string

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId: number

  @Column({ name: 'external_user_id', type: 'varchar', nullable: true })
  externalUserId: string

  @Column({ name: 'requester_ip_address', type: 'varchar', nullable: true })
  requesterIpAddress: string

  @Column({ name: 'cache_hit', type: 'varchar', nullable: true, default: 'None' })
  cacheHit: string

  @Column({ name: 'cache_key', type: 'varchar', nullable: true, default: 'Cache OFF' })
  cacheKey: string

  @Column({ name: 'session_id', type: 'varchar', nullable: true })
  sessionId: string

  @Column({ name: 'status', type: 'varchar', default: 'success' })
  status: string

  @Column({ name: 'reasoning_tokens', type: 'integer', nullable: true, default: 0 })
  reasoningTokens: number

  @Column({ name: 'cached_tokens', type: 'integer', nullable: true, default: 0 })
  cachedTokens: number

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: Record<string, any>

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User

  public get toResponse() {
    return {
      id: this.id,
      requestId: this.requestId,
      callType: this.callType,
      spend: parseFloat(this.spend.toString()),
      totalTokens: this.totalTokens,
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      startTime: this.startTime,
      endTime: this.endTime,
      model: this.model,
      modelGroup: this.modelGroup,
      customLlmProvider: this.customLlmProvider,
      userId: this.userId,
      externalUserId: this.externalUserId,
      status: this.status,
      reasoningTokens: this.reasoningTokens,
      cachedTokens: this.cachedTokens,
      user: this.user?.baseGroup,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}