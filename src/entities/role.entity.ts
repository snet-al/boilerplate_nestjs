import { BasicEntity } from './basic.entity'
import { UsersRoles } from './users_roles.entity'
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'

export enum UserRoles {
  admin = 'administrator',
  user = 'user',
  role1 = 'role1',
  role2 = 'role2',
}

@Entity('roles')
export class Role extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', nullable: true })
  name: string

  @Column({ name: 'permissions', type: 'json', nullable: true })
  permissions: string

  @OneToMany(() => UsersRoles, (userRole) => userRole.role)
  userRoles: UsersRoles[]

  public get baseGroup() {
    return {
      id: this.id,
      name: this.name,
      permissions: this.permissions,
    }
  }
}
