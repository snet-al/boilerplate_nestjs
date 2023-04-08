import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { RoleService } from './role.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../../entities/user.entity'
import { Role } from '../../entities/role.entity'
import { UsersModule } from '../user/user.module'
import { RolesController } from './roles.controller'
import { JwtStrategy } from '../strategies/jwt.strategy'
import { PaginationService } from '../../common/pagination.service'

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), JwtModule.register({}), UsersModule],
  providers: [RoleService, PaginationService, JwtStrategy],
  controllers: [RolesController],
  exports: [],
})
export class RolesModule {}
