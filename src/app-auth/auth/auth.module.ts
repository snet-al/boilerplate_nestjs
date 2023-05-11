import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PassportModule } from '@nestjs/passport'
import { UsersModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { RefreshToken } from '../../entities/refresh_token.entity'
import { UserActivationToken } from '../../entities/user_activation_token.entity'

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
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
