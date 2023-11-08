import * as bcrypt from 'bcryptjs'
import { Response } from 'express'
import { UserDto } from './dto/user.dto'
import { UserService } from './user.service'
import { Role } from '../../entities/role.entity'
import { User } from '../../entities/user.entity'
import { BaseController } from '../../app-api/base.controller'
import { FindUserOrFailPipeService } from './pipe/find-user-or-fail-pipe.service'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { FindRoleOrFailPipeService } from '../role/pipe/find-role-or-fail-pipe.service'
import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Put, Req, Res, UsePipes, Delete, ValidationPipe, Patch } from '@nestjs/common'

@ApiTags('Users')
@Controller('/users')
@ApiBearerAuth()
export class UserController extends BaseController {
  @Inject(UserService)
  //od e shpjegopj me vone bledi
  private readonly service: UserService

  @Get()
  @ApiOperation({
    summary: 'Get all users of the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'All users successfully returned.',
  })
  async getAll(@Req() req, @Res() res) {
    let filterParams = {}
    try {
      filterParams = JSON.parse(req.query?.filters)
    } catch (e) {}
    try {
      const data = await this.service.getAll(req, filterParams)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one users of the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'The user was successfully returned.',
  })
  async findOne(@Param('id', ParseIntPipe, FindUserOrFailPipeService) user: User, @Res() res) {
    try {
      const user = this.findOne()
      return this.success(res, user.baseGroup)
    } catch (err) {
      if(err)
      return this.error(res, err.message)
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Admin registers a new user into the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully created.',
  })
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async createUser(@Body() createUserDto: UserDto, @Res() res: Response) {
    try {
      const user = await this.service.create(createUserDto)
      return this.success(res, user)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update one user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User was successfully updated!',
  })
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async update(@Param('id', ParseIntPipe, FindUserOrFailPipeService) user: User, @Body() updateUserDto: UserDto, @Res() res) {
    try {
      const updatedUser = await this.service.updateUserData(user, updateUserDto)
      return this.success(res, updatedUser)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Patch(':id/password')
  @ApiOperation({
    summary: 'Update password of user.',
  })
  @ApiResponse({
    status: 200,
    description: `User's password was successfully updated!`,
  })
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async updatePassword(@Param('id', ParseIntPipe, FindUserOrFailPipeService) user: User, @Body() updateUserDto: UserDto, @Res() res) {
    try {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10)
      const updatedUser = await this.service.updateUserData(user, updateUserDto)
      return this.success(res, updatedUser)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete one user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User was successfully deleted!',
  })
  async remove(@Param('id', ParseIntPipe, FindUserOrFailPipeService) user: User, @Res() res) {
    try {
      await this.service.remove(user.id)
      return this.success(res, {})
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Delete(':id/user-role/:userRoleId')
  @ApiOperation({
    summary: 'Delete one role of the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role of the user was successfully deleted!',
  })
  async removeUserRole(
    @Param('id', ParseIntPipe, FindUserOrFailPipeService) user: User,
    @Param('userRoleId', ParseIntPipe, FindRoleOrFailPipeService) role: Role,
    @Res() res,
  ) {
    try {
      await this.service.removeUserRole(user, role)
      return this.success(res, {})
    } catch (err) {
      return this.error(res, err.message)
    }
  }
}
