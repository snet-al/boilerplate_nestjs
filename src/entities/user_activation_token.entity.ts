import { Column, Entity } from 'typeorm'
import { BasicEntity } from './basic.entity'

@Entity('user_activation_token')
export class UserActivationToken extends BasicEntity {
  @Column({ name: 'token', type: 'varchar', nullable: true })
  token: string

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number
}
