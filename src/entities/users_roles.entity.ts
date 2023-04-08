import { Role } from './role.entity'
import { User } from './user.entity'
import { BasicEntity } from './basic.entity'
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity('users_roles')
export class UsersRoles extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  public role?: Role

  @Column({ name: 'role_id', type: 'integer', nullable: true })
  public roleId: number

  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  public user?: User

  @Column({ type: 'integer', name: 'user_id', nullable: true })
  public userId: number

  public get toResponseWithRole() {
    return {
      id: this.id,
      role: this.role,
      roleId: this.roleId,
    }
  }
}
