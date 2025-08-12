import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '../../../entities/user.entity'
import { AuthenticatedUser, UserContext } from '../interfaces/key.interface'

@Injectable()
export class UserAuthHelper {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Extract user context from authenticated request
   */
  async getUserContext(authUser: AuthenticatedUser): Promise<UserContext> {
    const localUserId = authUser?.userId || authUser?.sub || authUser?.id
    
    if (!localUserId) {
      throw new UnauthorizedException('No authenticated user found')
    }

    const user = await this.userRepo.findOne({ where: { id: localUserId } })
    
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    if (!user.externalUserId) {
      throw new UnauthorizedException('User external ID not set. Please contact support.')
    }

    return {
      localUserId: user.id,
      externalUserId: user.externalUserId,
    }
  }

  /**
   * Get external user ID from authenticated request
   */
  async getExternalUserId(authUser: AuthenticatedUser): Promise<string> {
    const context = await this.getUserContext(authUser)
    return context.externalUserId
  }

  /**
   * Get local user ID from authenticated request
   */
  async getLocalUserId(authUser: AuthenticatedUser): Promise<number> {
    const context = await this.getUserContext(authUser)
    return context.localUserId
  }
}
