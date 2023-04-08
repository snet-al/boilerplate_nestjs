import path = require('path')
import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { diskStorage } from 'multer'
import { createReadStream } from 'fs'
import { FileService } from './file.service'
import { File } from '../../entities/file.entity'
import { CreateFileDto } from './dto/create-file.dto'
import { UpdateFileDto } from './dto/update-file.dto'
import { ResponseFileDto } from './dto/response-file.dto'
import { Attachment } from '../../entities/attachment.entity'
import { BaseController } from '../../app-api/base.controller'
import { UpdateAttachmentDto } from '../attachment/dto/update-attachment.dto'
import { FindFileOrFailPipeService } from './pipe/find-file-or-fail-pipe.service'
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { FindAttachmentOrFailPipeService } from '../attachment/pipe/find-attachment-or-fail-pipe.service'
import { ApiPaginateDto, ApiPaginateObjDto, ResponsePaginationDto, ResponsePaginationObjDto } from '../../common/dto/pagination.dto'
import { Controller, Get, Post, Body, Param, Delete, Req, Res, ParseIntPipe, Inject, StreamableFile, HttpStatus, Put } from '@nestjs/common'

const storage = {
  storage: diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
      const filename: string = path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4()
      const extension: string = path.parse(file.originalname).ext

      cb(null, `${filename}${extension}`)
    },
  }),
}

@ApiBearerAuth()
@ApiTags('File')
@Controller('files')
@ApiExtraModels(ResponsePaginationDto, ResponsePaginationObjDto, CreateFileDto, UpdateFileDto)
export class FilesController extends BaseController {
  @Inject(FileService)
  private readonly fileService: FileService

  @Post()
  @ApiOperation({
    summary: 'Create a new file.',
  })
  @ApiResponse({
    status: 200,
    description: 'The file was successfully created.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The file was successfully created.', type: ResponseFileDto })
  async create(@Body() createFileDto: CreateFileDto, @Res() res: Response) {
    try {
      const file = await this.fileService.create(createFileDto)
      return this.success(res, file.toResponse)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all files.',
  })
  @ApiResponse({
    status: 200,
    description: 'All files were successfully returned.',
  })
  @ApiPaginateDto({ status: 200, description: 'All files were successfully returned.', type: ResponseFileDto })
  async findAll(@Req() req, @Res() res: Response) {
    try {
      const files = await this.fileService.findAll(req)
      return this.success(res, files)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one file.',
  })
  @ApiResponse({
    status: 200,
    description: 'The file was successfully returned.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The file was successfully returned.', type: ResponseFileDto })
  findOne(@Param('id', ParseIntPipe, FindFileOrFailPipeService) file: File, @Res() res: Response) {
    try {
      return this.success(res, file.toResponse)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update one file.',
  })
  @ApiResponse({
    status: 200,
    description: 'The file was successfully updated.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The file was successfully updated.', type: ResponseFileDto })
  async update(@Param('id', ParseIntPipe, FindFileOrFailPipeService) file: File, @Body() updateFileDto: UpdateFileDto, @Res() res: Response) {
    try {
      const updatedFile = await this.fileService.update(file, updateFileDto)
      return this.success(res, updatedFile.toResponse)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete one file.',
  })
  @ApiResponse({
    status: 200,
    description: 'The file was successfully deleted.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The file was successfully deleted.', type: ResponseFileDto })
  async remove(@Param('id', ParseIntPipe, FindFileOrFailPipeService) file: File, @Res() res: Response) {
    try {
      await this.fileService.remove(file)
      return this.success(res, {})
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get('fileAttachment/:id')
  @ApiOperation({
    summary: 'Get attachment of file.',
  })
  @ApiResponse({
    status: 200,
    description: 'The attachment of file was successfully returned.',
  })
  getAttachment(@Param('id', ParseIntPipe, FindAttachmentOrFailPipeService) attachment: Attachment, @Res() res: Response): StreamableFile {
    const file = createReadStream(attachment.path)
    return new StreamableFile(file)
  }

  @Post(':id/rename')
  @ApiOperation({
    summary: 'Rename one file.',
  })
  @ApiResponse({
    status: 200,
    description: 'The attachment was successfully renamed.',
  })
  async rename(@Param('id', ParseIntPipe, FindFileOrFailPipeService) file: File, @Body() updateDto: UpdateAttachmentDto, @Res() res: Response) {
    try {
      await this.fileService.rename(file, updateDto)
      return this.success(res, {})
    } catch (err) {
      return this.error(res, err.message)
    }
  }
}
