import * as bcrypt from 'bcryptjs'
import { UserDto } from './dto/user.dto'
import { JwtService } from '@nestjs/jwt'
import { Role } from '../../entities/role.entity'
import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { User, UserStatus } from '../../entities/user.entity'
import { UsersRoles } from '../../entities/users_roles.entity'
import { PaginationService } from '../../common/pagination.service'
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class UserService {
  @InjectRepository(User)
  private repository: Repository<User>

  @InjectRepository(Role)
  private roleRepository: Repository<Role>

  @InjectRepository(UsersRoles)
  private usersRoleRepository: Repository<UsersRoles>

  @Inject(PaginationService)
  public paginationService: PaginationService

  @Inject(JwtService)
  private jwtService: JwtService

  async create(createdUserDto: UserDto) {
    const foundUser = await this.repository.findOne({ where: { email: createdUserDto.email } })
    if (foundUser) {
      throw new ConflictException('This email is already used to register a user!')
    }

    let createdUser = this.repository.create(createdUserDto)
    createdUser.password = await bcrypt.hash(createdUserDto.password, 10)
    const user = await this.repository.save(createdUser)

    if (createdUserDto.roleIds) {
      for (const roleId of createdUserDto.roleIds) {
        const role = await this.roleRepository.findOne({ where: { id: roleId } })
        if (!role) {
          throw new BadRequestException(`Role with ID: ${roleId} does not exist!`)
        }
        const createdUserRole = this.usersRoleRepository.create({ role: role, user: user })
        await this.usersRoleRepository.save(createdUserRole)
      }
    }

    const accountActivationToken = this.jwtService.sign(
      { userId: user.id },
      {
        secret: process.env.JWT_ACCESS_TOKEN_SECRET,
        expiresIn: '30d',
      },
    )

    return user[0]
  }

  async getAll(request: any, filters: any) {
    const queryBuilder = this.repository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
    await this.paginationService.paginateQueryBuilder(queryBuilder, request)
    const results = await queryBuilder.getManyAndCount()
    const items = results[0].map((users) => users.toResponse)
    const totalRecords = results[1] || 0
    return { items, totalRecords }
  }

  async remove(id: number) {
    return await this.repository.delete(id)
  }

  async removeUserRole(user: User, role: Role) {
    const userRole = await this.usersRoleRepository
      .createQueryBuilder('userRole')
      .where('userRole.userId = :userId', { userId: user.id })
      .andWhere('userRole.roleId = :roleId', { roleId: role.id })
      .getOne()
    if (!userRole) {
      throw new BadRequestException(`This role doesn't belong to this user!`)
    }
    return await this.usersRoleRepository.softRemove(userRole)
  }

  async updateUserData(user: User, updateUserDto: UserDto) {
    // const foundUser = await this.usersRepository.findOne({ where: { email: updateUserDto.email, id: Not(id) } })
    // if (foundUser) {
    //   throw new ConflictException('This email is already used to register a user!')
    // }

    const mergedUser = this.repository.merge(user, updateUserDto)
    const updatedUser = await this.repository.save(mergedUser)

    if (updateUserDto.roleIds)
      for (const roleId of updateUserDto.roleIds) {
        const role = await this.roleRepository.findOne({ where: { id: roleId } })
        if (!role) {
          throw new BadRequestException('Role does not exist!')
        }
        const userRole = await this.usersRoleRepository.findOne({ where: { roleId: role.id, userId: user.id } })
        if (!userRole) {
          const createdUserRole = this.usersRoleRepository.create({ role: role, user: user })
          await this.usersRoleRepository.save(createdUserRole)
        }
      }
    return updatedUser
  }

  async deactivate(id: number) {
    const user = await this.findOne({ id })
    if (!user) {
      throw new NotFoundException(`User with ID: ${id} does not exist!`)
    }
    user.status = UserStatus.DEACTIVATED
    await this.repository.save(user)
    return user.baseGroup
  }

  async findOne(whereCondition): Promise<User | undefined> {
    return await this.repository.findOne({ where: whereCondition, relations: ['userRoles'] })
  }

  async update(id: number, data: any): Promise<UpdateResult> {
    return await this.repository.update({ id }, data)
  }
}
