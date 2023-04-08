import { Entity, Column } from 'typeorm'
import { BasicEntity } from './basic.entity'

@Entity('refresh_tokens')
export class RefreshToken extends BasicEntity {
  @Column({ name: 'refresh_token', type: 'varchar', nullable: true })
  refreshToken: string

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date
}
