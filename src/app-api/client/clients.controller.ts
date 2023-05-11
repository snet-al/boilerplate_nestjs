import { Response } from 'express'
import { ClientService } from './client.service'
import { Client } from '../../entities/client.entity'
import { BaseController } from '../base.controller'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { ResponseClientDto } from './dto/response-client.dto'
import { FindClientOrFailPipeService } from './pipe/find-client-or-fail-pipe.service'
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Controller, Get, Post, Body, Put, Param, Delete, Res, Inject, Req, ParseIntPipe } from '@nestjs/common'
import { ApiPaginateDto, ApiPaginateObjDto, ResponsePaginationDto, ResponsePaginationObjDto } from '../../common/dto/pagination.dto'

@ApiBearerAuth()
@ApiTags('Clients')
@Controller('clients')
@ApiExtraModels(ResponsePaginationDto, ResponsePaginationObjDto, CreateClientDto, UpdateClientDto)
export class ClientsController extends BaseController {
  @Inject(ClientService)
  public clientService: ClientService

  @Get()
  @ApiOperation({
    summary: 'Get all clients of the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'All clients successfully returned.',
  })
  @ApiPaginateDto({ status: 200, description: 'All clients were successfully returned.', type: ResponseClientDto })
  async findAll(@Req() req, @Res() res: Response) {
    try {
      const clients = await this.clientService.findAll(req)
      return this.success(res, clients)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new client.',
  })
  @ApiResponse({
    status: 200,
    description: 'The new client was successfully created!',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The client was successfully created!', type: ResponseClientDto })
  async create(@Body() createClientDto: CreateClientDto, @Res() res) {
    try {
      const client = await this.clientService.create(createClientDto)
      return this.success(res, client)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one client.',
  })
  @ApiResponse({
    status: 200,
    description: 'The client was successfully return!',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The client successfully returned.', type: ResponseClientDto })
  async findOne(@Param('id', ParseIntPipe, FindClientOrFailPipeService) client: Client, @Res() res: Response) {
    try {
      return this.success(res, client)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update one client.',
  })
  @ApiResponse({
    status: 200,
    description: 'The client was successfully updated!',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The client was successfully updated.', type: ResponseClientDto })
  async update(
    @Param('id', ParseIntPipe, FindClientOrFailPipeService) client: Client,
    @Body() updateClientDto: UpdateClientDto,
    @Res() res: Response,
  ) {
    try {
      const updatedClient = await this.clientService.update(client, updateClientDto)
      return this.success(res, updatedClient)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a client.',
  })
  @ApiResponse({
    status: 200,
    description: 'The client was successfully deleted!',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The client was successfully deleted.', type: ResponseClientDto })
  async remove(@Param('id', ParseIntPipe, FindClientOrFailPipeService) client: Client, @Res() res: Response) {
    try {
      await this.clientService.remove(client)
      return this.success(res, {})
    } catch (err) {
      return this.error(res, err.message)
    }
  }
}
