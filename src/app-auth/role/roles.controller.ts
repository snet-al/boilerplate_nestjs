import { Response } from 'express'
import { RoleDto } from './dto/role.dto'
import { RoleService } from './role.service'
import { Role } from '../../entities/role.entity'
import { BaseController } from '../../app-api/base.controller'
import { FindRoleOrFailPipeService } from './pipe/find-role-or-fail-pipe.service'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Put, Req, Res, UsePipes, Delete, ValidationPipe } from '@nestjs/common'

@ApiTags('Roles')
@Controller('/roles')
@ApiBearerAuth()
export class RolesController extends BaseController {
  @Inject(RoleService)
  private roleService: RoleService

  @Get('')
  @ApiOperation({
    summary: 'Get all roles of the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'All roles successfully returned.',
  })
  async getRoles(@Req() req, @Res() res) {
    try {
      const data = await this.roleService.getAll()
      return this.success(res, data)
    } catch (err) {
      this.error(res, err.message)
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one role of the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role successfully returned.',
  })
  async findOne(@Param('id', ParseIntPipe, FindRoleOrFailPipeService) role: Role, @Res() res) {
    try {
      return this.success(res, role.baseGroup)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Admin creates a new role into the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role successfully created.',
  })
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async createRole(@Body() createRoleDto: RoleDto, @Res() res: Response) {
    try {
      const role = await this.roleService.create(createRoleDto)
      return this.success(res, role)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update one role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role was successfully updated.',
  })
  async update(@Param('id', ParseIntPipe, FindRoleOrFailPipeService) role: Role, @Body() updateRoleDto: RoleDto, @Res() res) {
    try {
      const updatedRole = await this.roleService.update(role, updateRoleDto)
      return this.success(res, updatedRole)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete one role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Role was successfully deleted',
  })
  async remove(@Param('id', ParseIntPipe, FindRoleOrFailPipeService) role: Role, @Res() res) {
    try {
      await this.roleService.remove(role)
      return this.success(res, {})
    } catch (err) {
      return this.error(res, err.message)
    }
  }
}
