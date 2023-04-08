const bcrypt = require('bcrypt')
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { LoginDto } from './dto/login.dto'
import { UserService } from '../user/user.service'
import { InjectRepository } from '@nestjs/typeorm'
import { TokenPayloadDto } from './dto/token-payload.dto'
import { User, UserStatus } from '../../entities/user.entity'
import { ResetPasswordDto } from '../user/dto/reset-password.dto'
import { RefreshToken } from '../../entities/refresh_token.entity'
import { ValidateBodyTokenDto } from './dto/validate-body-token.dto'
import { PasswordResetRequestDto } from './dto/password-reset-request.dto'
import { UserActivationToken } from '../../entities/user_activation_token.entity'
import { BadRequestException, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class AuthService {
  @Inject(JwtService)
  private jwtService: JwtService

  @Inject(UserService)
  private userService: UserService

  @InjectRepository(UserActivationToken)
  private userActivationTokenRepository: Repository<UserActivationToken>

  @InjectRepository(RefreshToken)
  private tokenRepository: Repository<RefreshToken>

  async login(loginDto: LoginDto) {
    const user = await this.validateCredentials(loginDto.email, loginDto.password)
    if (!user) {
      throw new ForbiddenException('Wrong Credentials!')
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION,
      },
    )

    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION,
      },
    )
    const updatedToken = await this.updateRefreshToken(refreshToken, user.id)

    return {
      authentication: {
        accessToken,
        refreshToken,
        expiresAt: updatedToken.expiresAt,
      },
      user: {
        name: user.name,
        email: user.email,
      },
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { password, passwordConfirmation, token } = resetPasswordDto

    if (password !== passwordConfirmation) {
      throw new BadRequestException('Passwords do not match!')
    }

    const decodedToken = this.verifyAndDecodeToken(token)
    if (!decodedToken) {
      throw new UnauthorizedException('Invalid reset token!')
    }

    const user = await this.userService.findOne({ email: decodedToken.email, passwordResetToken: token })
    if (!user) {
      throw new UnauthorizedException('User not found!')
    }

    await this.userService.update(user.id, {
      password: await bcrypt.hash(password, 10),
      passwordResetToken: null,
    })

    return this.getUserData(user)
  }

  async requestPasswordResetLink(dto: PasswordResetRequestDto) {
    const user = await this.userService.findOne({ email: dto.email })
    if (!user) {
      return {
        message: 'Password reset link requested successfully!',
      }
    }

    const passwordResetToken = this.jwtService.sign(
      { email: user.email },
      { secret: process.env.JWT_ACCESS_TOKEN_SECRET || 'secret', expiresIn: '2d' },
    )
    await this.userService.update(user.id, { passwordResetToken })

    // TODO: Add email service
    // this.mailerService
    //   .sendMail({
    //     to: user.email,
    //     subject: 'Password Reset',
    //     template: './templates/email/password-reset',
    //     context: {
    //       name: user.fullName,
    //       link: `${process.env.FRONT_BASE_URL}/reset-password?token=${passwordResetToken}`,
    //     },
    //   })
    //   .catch((err) => {
    //     throw err
    //   })

    return {
      message: 'Password reset link requested successfully!',
    }
  }

  async validatePasswordResetToken(dto: ValidateBodyTokenDto) {
    const decodedToken = this.verifyAndDecodeToken(dto.token)
    if (!decodedToken) {
      throw new UnauthorizedException('Token is not valid or has expired!')
    }

    const user = await this.userService.findOne({ email: decodedToken.email, passwordResetToken: dto.token })
    if (!user) {
      throw new UnauthorizedException('Token is not valid or has expired!')
    }
    return {
      email: user.email,
    }
  }

  async getUserData(user: User) {
    const payload = { id: user.id, email: user.email, canAuthenticate: true }
    const token = this.getAccessToken(payload)

    return {
      token,
    }
  }

  getAccessToken(payload: TokenPayloadDto) {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION,
    })
  }

  verifyAndDecodeToken(token: string) {
    try {
      return this.jwtService.verify(token, { secret: process.env.JWT_ACCESS_TOKEN_SECRET || 'secret' })
    } catch (err) {
      return null
    }
  }

  async updateRefreshToken(refreshToken: string, userId: number) {
    let expiresAt = null
    if (refreshToken) {
      refreshToken = await bcrypt.hash(refreshToken, 10)
      const date = new Date()
      date.setDate(date.getDate() + 7)
      expiresAt = date
    }

    try {
      let token = await this.tokenRepository.findOne({ where: { userId } })

      if (!token) {
        token = this.tokenRepository.create({ refreshToken, userId, expiresAt })
        token = await this.tokenRepository.save(token)
        return token
      }

      token = this.tokenRepository.merge(token, { refreshToken, expiresAt })
      token = await this.tokenRepository.save(token)
      return token
    } catch (error) {
      throw Error(error)
    }
  }

  async validateActivationToken(dto: ValidateBodyTokenDto) {
    const decodedToken = this.verifyAndDecodeToken(dto.token)
    if (!decodedToken) {
      throw new UnauthorizedException('Token is not valid or has expired!')
    }

    const token = await this.userActivationTokenRepository.findOne({ where: { userId: decodedToken.userId, token: dto.token } })
    if (!token) {
      throw new UnauthorizedException('Token is not valid or has expired!')
    }
    return {
      isValid: true,
      message: 'Account activation token is valid!',
    }
  }

  async activateUser(dto: ResetPasswordDto) {
    const { password, passwordConfirmation, token } = dto

    if (password !== passwordConfirmation) {
      throw new BadRequestException('Passwords do not match!')
    }

    const decodedToken = this.verifyAndDecodeToken(token)
    if (!decodedToken) {
      throw new UnauthorizedException('Token is not valid or has expired!')
    }

    const activationToken = await this.userActivationTokenRepository.findOne({
      where: {
        userId: decodedToken.userId,
        token: dto.token,
      },
    })
    if (!activationToken) {
      throw new UnauthorizedException('Token is not valid or has expired!')
    }

    const user = await this.userService.findOne({ id: decodedToken.userId })
    if (!user) {
      throw new UnauthorizedException('User does not exist!')
    }

    await this.userService.update(user.id, {
      password: await bcrypt.hash(password, 10),
      status: UserStatus.ACTIVATED,
      isEmailVerified: true,
    })

    await this.userActivationTokenRepository.delete(activationToken.id)

    return {
      activated: true,
      message: 'User activated successfully!',
    }
  }

  async logout(user: any) {
    this.updateRefreshToken(null, user.userId)
  }

  async validateCredentials(email: string, password: string): Promise<any> {
    const user = await this.userService.findOne({ email })
    return user && (await bcrypt.compare(password, user.password)) ? user : null
  }
}
