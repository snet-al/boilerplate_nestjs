import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PassportModule } from '@nestjs/passport'
import { UsersModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { RefreshToken } from 'src/entities/refresh_token.entity'
import { UserActivationToken } from 'src/entities/user_activation_token.entity'
import { MailerModule } from '@nestjs-modules/mailer'

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    MailerModule,
    TypeOrmModule.forFeature([UserActivationToken, RefreshToken]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'testkey',
      signOptions: { expiresIn: '1516546s' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
