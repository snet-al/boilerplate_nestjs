const bcrypt = require('bcrypt')
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { LoginDto } from './dto/login.dto'
import { UserService } from '../user/user.service'
import { InjectRepository } from '@nestjs/typeorm'
import { TokenPayloadDto } from './dto/token-payload.dto'
import { User, UserStatus } from '../../entities/user.entity'
import { ResetPasswordDto } from '../user/dto/reset-password.dto'
import { SignupDto } from './dto/signup.dto'
import { RefreshToken } from '../../entities/refresh_token.entity'
import { ValidateBodyTokenDto } from './dto/validate-body-token.dto'
import { PasswordResetRequestDto } from './dto/password-reset-request.dto'
import { UserActivationToken } from '../../entities/user_activation_token.entity'
import { BadRequestException, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class AuthService {
  @Inject(JwtService)
  private jwtService: JwtService

  @Inject(UserService)
  private userService: UserService

  @Inject(MailerService)
  private mailerService: MailerService

  @InjectRepository(UserActivationToken)
  private userActivationTokenRepository: Repository<UserActivationToken>

  @InjectRepository(RefreshToken)
  private tokenRepository: Repository<RefreshToken>

  async login(loginDto: LoginDto) {
    let user = await this.validateCredentials(loginDto.email, loginDto.password)
    if (!user) {
      throw new ForbiddenException('Wrong Credentials!')
    }

    // Ensure external user exists for current account (to enable key management)
    try {
      if (!user.externalUserId) {
        await this.userService.syncExistingUserWithExternal(user.id)
        user = await this.userService.findOne({ id: user.id })
      }
    } catch (_) {}

    const accessExp = (process.env.JWT_ACCESS_TOKEN_EXPIRATION || '1d').trim()
    const refreshExp = (process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d').trim()

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: accessExp as any },
    )

    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: refreshExp as any },
    )
    const updatedToken = await this.updateRefreshToken(refreshToken, user.id)

    return {
      authentication: {
        accessToken,
        refreshToken,
        expiresAt: updatedToken.expiresAt,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        externalUserId: user.externalUserId,
      },
    }
  }

  async signup(signupDto: SignupDto) {
    let user = await this.userService.createPublic(signupDto)

    // Ensure external user sync completed successfully (similar to login flow)
    if (!user.externalUserId) {
      try {
        await this.userService.syncExistingUserWithExternal(user.id)
        user = await this.userService.findOne({ id: user.id })
      } catch (error) {
        // Log error but don't fail signup
        console.warn('Failed to sync external user during signup:', error.message)
      }
    }

    // Send set-password link via the reset page
    const activationToken = this.jwtService.sign(
      { email: user.email },
      { secret: process.env.JWT_ACCESS_TOKEN_SECRET || 'secret', expiresIn: '7d' },
    )
    const frontBase = process.env.FRONT_BASE_URL || 'http://localhost:3000'
    const activationLink = `${frontBase}/auth/reset-password?token=${activationToken}`
    this.mailerService
      .sendMail({
        to: user.email,
        subject: 'Set your password',
        template: 'password-reset',
        context: { name: user.fullName, link: activationLink },
      })
      .catch(() => {})

    // Return the same format as login to ensure consistency
    const accessExp = (process.env.JWT_ACCESS_TOKEN_EXPIRATION || '1d').trim()
    const refreshExp = (process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d').trim()

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: accessExp as any },
    )

    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: refreshExp as any },
    )
    const updatedToken = await this.updateRefreshToken(refreshToken, user.id)

    return {
      authentication: {
        accessToken,
        refreshToken,
        expiresAt: updatedToken.expiresAt,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        externalUserId: user.externalUserId,
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

    const user = await this.userService.findOne({ email: decodedToken.email })
    if (!user) {
      throw new UnauthorizedException('User not found!')
    }

    await this.userService.update(user.id, {
      password: await bcrypt.hash(password, 10),
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

    // TODO: Add email service
    this.mailerService
      .sendMail({
        to: user.email,
        subject: 'Password Reset',
        template: 'password-reset',
        context: {
          name: user.fullName,
          link: `${process.env.FRONT_BASE_URL || 'http://localhost:3000'}/auth/reset-password?token=${passwordResetToken}`,
        },
      })
      .catch((err) => {
        throw err
      })

    return {
      message: 'Password reset link requested successfully!',
    }
  }

  async validatePasswordResetToken(dto: ValidateBodyTokenDto) {
    const decodedToken = this.verifyAndDecodeToken(dto.token)
    if (!decodedToken) {
      throw new UnauthorizedException('Token is not valid or has expired!')
    }

    const user = await this.userService.findOne({ email: decodedToken.email })
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
    // Use JwtModule default secret; control expiration with sane default
    const accessExp = (process.env.JWT_ACCESS_TOKEN_EXPIRATION || '1d').trim()
    return this.jwtService.sign(payload, { expiresIn: accessExp as any })
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
