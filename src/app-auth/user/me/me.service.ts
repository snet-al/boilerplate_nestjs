import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { UserService } from '../user.service'
import * as bcrypt from 'bcryptjs'
import { ChangePasswordDto } from './dto/change-password.dto'
import { PaginationService } from '../../../common/pagination.service'

@Injectable()
export class MeService {
  @Inject(UserService)
  public userService: UserService

  @Inject(PaginationService)
  public paginationService: PaginationService

  async me(user) {
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      image: user.image,
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto, user) {
    const { password, passwordConfirmation } = changePasswordDto

    if (password !== passwordConfirmation) {
      throw new BadRequestException('Passwords do not match!')
    }
    await this.userService.update(user.id, { password: await bcrypt.hash(password, 10) })
    return {
      message: 'Password changed successfully',
    }
  }
}
