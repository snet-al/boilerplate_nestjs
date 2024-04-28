import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { BasicEntity } from './basic.entity'
import { UsersRoles } from './users_roles.entity'

export enum UserStatus {
  ACTIVATED = 'activated',
  PENDING = 'pending',
  DEACTIVATED = 'deactivated',
}

@Entity('users')
export class User extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'parent_id', type: 'integer', nullable: true })
  parentId: number

  @Column({ name: 'name', type: 'varchar', nullable: true })
  name: string

  @Column({ name: 'email', type: 'varchar', nullable: true })
  email: string

  @Column({ name: 'password', type: 'varchar', nullable: true })
  password: string

  @Column({ name: 'status', type: 'varchar', default: UserStatus.PENDING, nullable: true })
  status: string

  @Column({ name: 'phone', type: 'varchar', nullable: true })
  phone: string

  @Column({ name: 'image', type: 'varchar', nullable: true })
  image: string

  @Column({ name: 'verification_token', type: 'varchar', nullable: true })
  verificationToken: string

  @Column({ name: 'department', type: 'varchar', nullable: true })
  department: string

  @Column({ name: 'is_email_verified', type: 'boolean', nullable: true })
  isEmailVerified: boolean

  @Column({ name: 'last_login', type: 'date', nullable: true })
  lastLogin: Date

  @OneToMany(() => UsersRoles, (userRole) => userRole.user)
  userRoles: UsersRoles[]

  public get baseGroup() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      status: this.status,
      phone: this.phone,
      image: this.image,
    }
  }

  public get toResponse() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      status: this.status,
      phone: this.phone,
      image: this.image,
      department: this.department,
      isEmailVerified: this.isEmailVerified,
      lastLogin: this.lastLogin,
      userRoles: this.userRoles?.map((userRole) => userRole.toResponseWithRole) || undefined,
      userRolesIds: [],
      parentId: this.parentId,
    }
  }

  public get fullName() {
    return this.name
  }
}

// @EntityRepository(User)
// export class UserRepository extends BaseRepository<User> {}
