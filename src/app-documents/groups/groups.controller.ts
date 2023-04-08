import { Request, Response } from 'express'
import { GroupService } from './group.service'
import { Group } from '../../entities/group.entity'
import { CreateGroupDto } from './dto/create-group.dto'
import { UpdateGroupDto } from './dto/update-group.dto'
import { BaseController } from '../../app-api/base.controller'
import { ResponseGroupDto } from './dto/response-group.dto'
import { ApiPaginateDto, ApiPaginateObjDto } from '../../common/dto/pagination.dto'
import { FindGroupOrFailPipeService } from './pipe/find-group-or-fail-pipe.service'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Controller, Get, Body, Param, Delete, Req, Res, ParseIntPipe, Inject, Post, HttpStatus, Put } from '@nestjs/common'

@ApiBearerAuth()
@ApiTags('Groups')
@Controller('groups')
export class GroupsController extends BaseController {
  @Inject(GroupService)
  private readonly groupService: GroupService

  @Get('locations')
  @ApiOperation({
    summary: 'Get tree of the groups.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tree of the groups was successfully returned.',
  })
  @ApiPaginateDto({ status: 200, description: 'All locations were successfully returned.', type: ResponseGroupDto })
  async locations(@Req() req, @Res() res: Response) {
    try {
      req.query.locations = true
      const locations = await this.groupService.buildTree(req)
      return this.success(res, locations)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get('locations-tree')
  @ApiOperation({
    summary: 'Get tree of the groups.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tree of the groups was successfully returned.',
  })
  @ApiPaginateDto({ status: 200, description: 'Location tree was successfully returned.', type: ResponseGroupDto })
  async locationTree(@Req() req, @Res() res: Response) {
    try {
      req.query.locations = true
      req.query.locationTree = true
      const locations = await this.groupService.buildTree(req)
      return this.success(res, locations)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new group.',
  })
  @ApiResponse({
    status: 200,
    description: 'The new group was successfully created.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The group was successfully created.', type: ResponseGroupDto })
  async create(@Body() createGroupDto: CreateGroupDto, @Res() res: Response) {
    try {
      const group = await this.groupService.create(createGroupDto)
      return this.success(res, group)
    } catch (error) {
      return this.error(res, error.mes)
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all groups.',
  })
  @ApiResponse({
    status: 200,
    description: 'All groups were successfully returned.',
  })
  @ApiPaginateDto({ status: 200, description: 'All groups were successfully returned.', type: ResponseGroupDto })
  async findAll(@Req() req, @Res() res: Response) {
    try {
      const groups = await this.groupService.findAll(req)
      return this.success(res, groups)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get('tree')
  @ApiPaginateDto({ status: 200, description: 'All groups were successfully returned.', type: ResponseGroupDto })
  async tree(@Req() req, @Res() res: Response) {
    const groups = await this.groupService.buildTree(req)
    return res.status(HttpStatus.OK).json({
      status: 'success',
      data: groups,
    })
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one group.',
  })
  @ApiResponse({
    status: 200,
    description: 'The group was successfully returned.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The group was successfully returned.', type: ResponseGroupDto })
  async findOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const group = await this.groupService.findOne(id)
      return this.success(res, group)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get(':id/with-documents')
  @ApiOperation({
    summary: 'Get one group with documents attached.',
  })
  @ApiResponse({
    status: 200,
    description: 'The group with documents attached was successfully returned.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The group with documents attached was successfully returned.', type: ResponseGroupDto })
  async findOneWithDocuments(@Param('id', ParseIntPipe, FindGroupOrFailPipeService) group: Group, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.groupService.findAllWithDocuments(group, req)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update one group.',
  })
  @ApiResponse({
    status: 200,
    description: 'The group was successfully updated.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The group was successfully updated.', type: ResponseGroupDto })
  async update(@Param('id', ParseIntPipe, FindGroupOrFailPipeService) group: Group, @Body() updateGroupDto: UpdateGroupDto, @Res() res: Response) {
    try {
      await this.groupService.update(group, updateGroupDto)
      return this.success(res, group.toResponse)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete one group.',
  })
  @ApiResponse({
    status: 200,
    description: 'The group was successfully deleted.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The group was successfully deleted.', type: ResponseGroupDto })
  remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      if (!this.groupService.remove(id)) {
        return this.error(res, 'Unable to delete this group')
      }
      return this.success(res, ['success'])
    } catch (err) {
      return this.error(res, err.message)
    }
  }
}
