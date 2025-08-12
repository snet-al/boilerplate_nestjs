import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, JoinColumn, RelationId } from 'typeorm'
import { BasicEntity } from './basic.entity'
import { User } from './user.entity'

@Entity('api_keys')
export class ApiKey extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User

  @RelationId((apiKey: ApiKey) => apiKey.user)
  userId?: number

  @Index()
  @Column({ name: 'external_user_id', type: 'varchar', nullable: true })
  externalUserId?: string

  @Index()
  @Column({ name: 'external_key_alias', type: 'varchar', nullable: true })
  externalKeyAlias?: string

  @Column({ name: 'source', type: 'varchar', default: 'litellm' })
  source: string

  @Column({ name: 'key_alias', type: 'varchar', nullable: true })
  keyAlias?: string

  @Index({ unique: true })
  @Column({ name: 'token_hash', type: 'varchar', nullable: true })
  tokenHash?: string

  @Column({ name: 'token_last4', type: 'varchar', nullable: true })
  tokenLast4?: string

  @Column({ name: 'token_prefix', type: 'varchar', nullable: true })
  tokenPrefix?: string

  @Column({ name: 'litellm_token_id', type: 'varchar', nullable: true })
  litellmTokenId?: string

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt?: Date

  @Column({ name: 'blocked', type: 'boolean', default: false })
  blocked: boolean

  @Column({ name: 'max_budget', type: 'float', nullable: true })
  maxBudget?: number

  @Column({ name: 'spend', type: 'float', nullable: true })
  spend?: number

  @Column({ name: 'models', type: 'json', nullable: true })
  models?: string[]

  @Column({ name: 'allowed_routes', type: 'json', nullable: true })
  allowedRoutes?: string[]

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata?: Record<string, any>

  @Column({ name: 'tags', type: 'json', nullable: true })
  tags?: string[]

  @Column({ name: 'revoked_at', type: 'datetime', nullable: true })
  revokedAt?: Date

  @Column({ name: 'rotated_at', type: 'datetime', nullable: true })
  rotatedAt?: Date
}


