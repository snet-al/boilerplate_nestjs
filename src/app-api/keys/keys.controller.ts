import { Body, Controller, Get, Post, Query, Param, Res, Req, UseGuards, ValidationPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Response, Request } from 'express'
import { BaseController } from '../base.controller'
import { KeysService } from './keys.service'
import { JwtAuthGuard } from '../../app-auth/guards/jwt-auth.guard'
import { GenerateKeyDto } from './dto/generate-key.dto'
import { ListKeysQueryDto } from './dto/list-keys-query.dto'
import { DeleteKeysDto, UpdateKeyDto, BlockKeyDto, RegenerateKeyDto } from './dto/key-operation.dto'
import { UserAuthHelper } from './helpers/user-auth.helper'

@ApiTags('Keys')
@ApiBearerAuth()
@Controller('/keys')
@UseGuards(JwtAuthGuard)
export class KeysController extends BaseController {
  constructor(
    private readonly service: KeysService,
    private readonly userAuthHelper: UserAuthHelper,
  ) { super() }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new API key' })
  @ApiResponse({ status: 201, description: 'API key generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generate(
    @Body(ValidationPipe) keyData: GenerateKeyDto, 
    @Req() req: Request, 
    @Res() res: Response
  ) {
    try {
      const authUser = (req as any).user
      const data = await this.service.generateKey(keyData, authUser)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post('service-account/generate')
  @ApiOperation({ summary: 'Generate a service account API key' })
  @ApiResponse({ status: 201, description: 'Service account key generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateService(
    @Body(ValidationPipe) keyData: GenerateKeyDto, 
    @Req() req: Request, 
    @Res() res: Response
  ) {
    try {
      const authUser = (req as any).user
      const data = await this.service.generateServiceAccountKey(keyData, authUser)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post('update')
  @ApiOperation({ summary: 'Update an API key' })
  @ApiResponse({ status: 200, description: 'API key updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Body(ValidationPipe) updateData: UpdateKeyDto, @Res() res: Response) {
    try {
      const data = await this.service.updateKey(updateData)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post('delete')
  @ApiOperation({ summary: 'Delete API keys' })
  @ApiResponse({ status: 200, description: 'API keys deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async delete(@Body(ValidationPipe) deleteData: DeleteKeysDto, @Res() res: Response) {
    try {
      const data = await this.service.deleteKeys(deleteData)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get('info')
  async info(@Query('key') key: string | undefined, @Res() res: Response) {
    try {
      const data = await this.service.info(key)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post(':key/regenerate')
  async regenerate(@Param('key') key: string, @Body() body: Record<string, any>, @Res() res: Response) {
    try {
      const data = await this.service.regenerateKey(key, body)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get('list')
  @ApiOperation({ summary: 'List API keys for authenticated user' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(
    @Query(ValidationPipe) query: ListKeysQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const authUser = (req as any).user
      const data = await this.service.list(query, authUser)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post('block')
  @ApiOperation({ summary: 'Block an API key' })
  @ApiResponse({ status: 200, description: 'API key blocked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async block(@Body(ValidationPipe) blockData: BlockKeyDto, @Res() res: Response) {
    try {
      const data = await this.service.block(blockData.key)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post('unblock')
  @ApiOperation({ summary: 'Unblock an API key' })
  @ApiResponse({ status: 200, description: 'API key unblocked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unblock(@Body(ValidationPipe) blockData: BlockKeyDto, @Res() res: Response) {
    try {
      const data = await this.service.unblock(blockData.key)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Post('health')
  async health(@Res() res: Response) {
    try {
      const data = await this.service.health()
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }
}


