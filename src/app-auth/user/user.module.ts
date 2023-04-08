import { JwtModule } from '@nestjs/jwt'
import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Role } from '../../entities/role.entity'
import { User } from '../../entities/user.entity'
import { UserController } from './user.controller'
import { JwtStrategy } from '../strategies/jwt.strategy'
import { UsersRoles } from '../../entities/users_roles.entity'
import { PaginationService } from '../../common/pagination.service'

@Module({
  imports: [TypeOrmModule.forFeature([User, UsersRoles, Role]), JwtModule.register({})],
  providers: [UserService, PaginationService, JwtStrategy],
  controllers: [UserController],
  exports: [UserService],
})
export class UsersModule {}
