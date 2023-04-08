import { LoginDto } from './dto/login.dto'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { LoginResponseDto } from './dto/login-response.dto'
import { BaseController } from '../../app-api/base.controller'
import { ResetPasswordDto } from '../user/dto/reset-password.dto'
import { ValidateBodyTokenDto } from './dto/validate-body-token.dto'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { PasswordResetRequestDto } from './dto/password-reset-request.dto'
import { Controller, Post, Body, ValidationPipe, UsePipes, Res, UseGuards, Req, Put, Inject } from '@nestjs/common'

@ApiTags('Authentication')
@Controller()
export class AuthController extends BaseController {
  @Inject(AuthService)
  private readonly authService: AuthService

  @Post('/login')
  @ApiResponse({
    status: 200,
    description: 'Token',
    type: LoginResponseDto,
  })
  @UsePipes(new ValidationPipe())
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      const data = await this.authService.login(loginDto)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post('/logout')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Token',
  })
  async logout(@Req() req: Request, @Res() res: Response) {
    const user = req.user
    await this.authService.logout(user)
    return this.success(res, 'User logged out successfully!')
  }

  @Put('/password-reset/request')
  @ApiOperation({
    summary: 'Request password reset link via email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset link requested successfully.',
  })
  @UsePipes(new ValidationPipe())
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto, @Res() res: Response) {
    try {
      const data = await this.authService.requestPasswordResetLink(dto)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post('/password-reset/validate-token')
  @ApiOperation({
    summary: 'Check if the password reset token obtained from email link is valid.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset token successfully validated.',
  })
  @UsePipes(new ValidationPipe())
  async validateResetPasswordToken(@Body() dto: ValidateBodyTokenDto, @Res() res: Response) {
    try {
      const data = await this.authService.validatePasswordResetToken(dto)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post('/password-reset')
  @ApiOperation({
    summary: 'Reset user password using reset password token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully.',
  })
  @UsePipes(new ValidationPipe())
  async resetPassword(@Body() dto: ResetPasswordDto, @Res() res: Response) {
    try {
      const data = await this.authService.resetPassword(dto)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post('/activate-user/validate-token')
  @ApiOperation({
    summary: 'Check if the activation token obtained from email link is valid.',
  })
  @ApiResponse({
    status: 200,
    description: 'Activation token successfully validated.',
  })
  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
  async validateActivationToken(@Body() dto: ValidateBodyTokenDto, @Res() res: Response) {
    try {
      const data = await this.authService.validateActivationToken(dto)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post('/activate-user')
  @ApiOperation({
    summary: 'Activate user account by using activation token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account activated successfully.',
  })
  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
  async activate(@Body() dto: ResetPasswordDto, @Res() res: Response) {
    try {
      const data = await this.authService.activateUser(dto)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  // @Post('/signup')
  // @ApiResponse({
  //   status: 200,
  //   description: 'User',
  //   type: UserDto,
  // })
  // register(@Body() data: SignupDto) {
  //   return this.service.signup(data)
  // }

  // @Get('/confirm')
  // @ApiResponse({
  //   status: 200,
  //   description: 'Token',
  //   type: LoginResponse,
  // })
  // async confirm(@Query('token') verificationToken: string, @Query('mode') mode: 'signup' | 'forgot-password') {
  //   return this.service.confirmToken(verificationToken, mode)
  // }

  // @Get('/check-token')
  // @ApiBearerAuth()
  // @ApiResponse({ status: 200, description: 'Return current user', type: UserDto })
  // async checkToken(@Headers('Authorization') authorization: string) {
  //   const [_, token] = authorization.split(' ')
  //   return this.service.checkToken(token)
  // }
}
