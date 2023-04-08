import { Response } from 'express'
import { AttachmentService } from './attachment.service'
import { Attachment } from '../../entities/attachment.entity'
import { BaseController } from '../../app-api/base.controller'
import { CreateAttachmentDto } from './dto/create-attachment.dto'
import { UpdateAttachmentDto } from './dto/update-attachment.dto'
import { ResponseAttachmentDto } from './dto/response-attachment.dto'
import { ApiPaginateDto, ApiPaginateObjDto } from '../../common/dto/pagination.dto'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { FindAttachmentOrFailPipeService } from './pipe/find-attachment-or-fail-pipe.service'
import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  Req,
  Res,
  ParseIntPipe,
  Inject,
  Post,
  StreamableFile,
  HttpStatus,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'

@ApiBearerAuth()
@ApiTags('Attachment')
@Controller('attachments')
export class AttachmentsController extends BaseController {
  @Inject(AttachmentService)
  private readonly attachmentService: AttachmentService

  @Post()
  @ApiOperation({
    summary: 'Create new attachment.',
  })
  @ApiResponse({
    status: 200,
    description: 'The attachment was successfully created.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The attachment was successfully created.', type: ResponseAttachmentDto })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createAttachmentDto: CreateAttachmentDto, @Res() res: Response) {
    try {
      const attachment = await this.attachmentService.create(createAttachmentDto)
      return this.success(res, attachment.toResponse)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all attachments.',
  })
  @ApiResponse({
    status: 200,
    description: 'All attachments were successfully returned.',
  })
  @ApiPaginateDto({ status: 200, description: 'All attachments were successfully returned.', type: ResponseAttachmentDto })
  async findAll(@Req() req, @Res() res: Response) {
    try {
      const attachments = await this.attachmentService.findAll(req)
      return this.success(res, attachments)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one attachment.',
  })
  @ApiResponse({
    status: 200,
    description: 'The attachment was successfully returned.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The attachment was successfully returned.', type: ResponseAttachmentDto })
  findOne(@Param('id', ParseIntPipe, FindAttachmentOrFailPipeService) attachment: Attachment, @Res() res: Response) {
    try {
      return this.success(res, attachment)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update one attachment.',
  })
  @ApiResponse({
    status: 200,
    description: 'The attachment was successfully updated.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The attachment was successfully updated.', type: ResponseAttachmentDto })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Res() res: Response,
    @Body() updateAttachmentDto: UpdateAttachmentDto,
    @Param('id', FindAttachmentOrFailPipeService) attachment: Attachment,
  ) {
    try {
      const data = await this.attachmentService.update(attachment, updateAttachmentDto)
      return this.success(res, data)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete one attachment.',
  })
  @ApiResponse({
    status: 200,
    description: 'The attachment was successfully deleted.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The attachment was successfully deleted.', type: ResponseAttachmentDto })
  async remove(@Param('id', ParseIntPipe, FindAttachmentOrFailPipeService) attachment: Attachment, @Res() res) {
    try {
      await this.attachmentService.remove(attachment)
      return this.success(res, {})
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get(':id/uploaded-attachment')
  getUploadedAttachment(@Param('id', ParseIntPipe, FindAttachmentOrFailPipeService) attachment: Attachment): StreamableFile {
    return this.attachmentService.getUploadedAttachment(attachment)
  }
}
