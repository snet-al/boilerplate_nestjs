import * as bcrypt from 'bcryptjs'
import { UserDto } from './dto/user.dto'
import { JwtService } from '@nestjs/jwt'
import { Role } from '../../entities/role.entity'
import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { User, UserStatus } from '../../entities/user.entity'
import { UsersRoles } from '../../entities/users_roles.entity'
import { PaginationService } from '../../common/pagination.service'
import { ExternalUserManagementService } from '../../common/services/external-user-management.service'
import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { SignupDto } from '../auth/dto/signup.dto'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

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

  @Inject(ExternalUserManagementService)
  private externalUserService: ExternalUserManagementService

  async create(createdUserDto: UserDto) {
    const foundUser = await this.repository.findOne({ where: { email: createdUserDto.email } })
    if (foundUser) {
      throw new ConflictException('This email is already used to register a user!')
    }

    let createdUser = this.repository.create(createdUserDto)
    createdUser.password = await bcrypt.hash('admin321', 10)
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

  async createPublic(signupDto: SignupDto) {
    const existing = await this.repository.findOne({ where: { email: signupDto.email } })
    if (existing) {
      throw new ConflictException('This email is already used to register a user!')
    }

    const userEntity = this.repository.create({
      email: signupDto.email,
      name: signupDto.name,
      password: await bcrypt.hash(signupDto.password, 10),
      status: UserStatus.PENDING,
      isEmailVerified: false,
    })

    let saved = await this.repository.save(userEntity)
    let shouldRollback = false

    try {
      const externalUserResponse = await this.externalUserService.syncUserWithExternal({
        id: saved.id,
        name: saved.name,
        email: saved.email,
      })

      saved.externalUserId = externalUserResponse.user_id
      saved.externalApiKey = externalUserResponse.key
      saved.externalProvider = 'litellm'
      saved.externalMetadata = externalUserResponse.metadata

      saved = await this.repository.save(saved)
      
      this.logger.log(`Successfully created external user for local user ${saved.id}`)
    } catch (error) {
      this.logger.error(`Failed to create external user for local user ${saved.id}: ${error.message}`)
      
      const shouldFailOnExternalError = process.env.FAIL_ON_EXTERNAL_USER_ERROR === 'true'
      if (shouldFailOnExternalError) {
        this.logger.warn(`Rolling back user creation due to external user failure`)
        shouldRollback = true
        await this.repository.delete(saved.id)
        throw new BadRequestException(`User registration failed: Unable to create external user account`)
      } else {
        this.logger.warn(`Continuing with user creation despite external user failure`)
      }
    }

    if (shouldRollback) {
      return null
    }

    return saved
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
    try {
      await this.cleanupExternalUser(id)
    } catch (error) {
      this.logger.warn(`Failed to cleanup external user before deletion: ${error.message}`)
    }
    
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

  async syncExistingUserWithExternal(userId: number): Promise<boolean> {
    try {
      const user = await this.findOne({ id: userId })
      if (!user) {
        throw new NotFoundException(`User with ID: ${userId} does not exist!`)
      }

      if (user.externalUserId) {
        this.logger.warn(`User ${userId} already has external user ID: ${user.externalUserId}`)
        return true
      }

      const externalUserResponse = await this.externalUserService.syncUserWithExternal({
        id: user.id,
        name: user.name,
        email: user.email,
      })

      await this.repository.update(user.id, {
        externalUserId: externalUserResponse.user_id,
        externalApiKey: externalUserResponse.key,
        externalProvider: 'litellm',
        externalMetadata: externalUserResponse.metadata,
      })

      this.logger.log(`Successfully synced existing user ${userId} with external service`)
      return true
    } catch (error) {
      this.logger.error(`Failed to sync user ${userId} with external service: ${error.message}`)
      return false
    }
  }

  async cleanupExternalUser(userId: number): Promise<boolean> {
    try {
      const user = await this.findOne({ id: userId })
      if (!user || !user.externalUserId) {
        return true
      }

      const deleted = await this.externalUserService.deleteExternalUser(user.externalUserId)
      
      if (deleted) {
        await this.repository.update(user.id, {
          externalUserId: null,
          externalApiKey: null,
          externalMetadata: null,
        })
        this.logger.log(`Successfully cleaned up external user for user ${userId}`)
      }

      return deleted
    } catch (error) {
      this.logger.error(`Failed to cleanup external user for user ${userId}: ${error.message}`)
      return false
    }
  }

  async getExternalUserInfo(userId: number): Promise<any> {
    try {
      const user = await this.findOne({ id: userId })
      if (!user || !user.externalUserId) {
        return null
      }

      return await this.externalUserService.getExternalUserInfo(user.externalUserId)
    } catch (error) {
      this.logger.error(`Failed to get external user info for user ${userId}: ${error.message}`)
      return null
    }
  }
}
