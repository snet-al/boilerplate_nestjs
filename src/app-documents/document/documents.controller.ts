import path = require('path')
import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { diskStorage } from 'multer'
import { DocumentService } from './document.service'
import { Document } from '../../entities/document.entity'
import { FileInterceptor } from '@nestjs/platform-express'
import { CreateDocumentDto } from './dto/create-document.dto'
import { UpdateDocumentDto } from './dto/update-document.dto'
import { BaseController } from '../../app-api/base.controller'
import { ResponseDocumentDto } from './dto/response-document.dto'
import { UpdateAttachmentDto } from '../attachment/dto/update-attachment.dto'
import { FindDocumentOrFailPipeService } from './pipe/find-document-or-fail-pipe.service'
import { FindGroupOrFailPipeService } from '../groups/pipe/find-group-or-fail-pipe.service'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ApiPaginateDto, ApiPaginateObjDto, ResponsePaginationDto, ResponsePaginationObjDto } from '../../common/dto/pagination.dto'
import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Res,
  ParseIntPipe,
  Inject,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  Put,
} from '@nestjs/common'

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
@ApiTags('Document')
@Controller('documents')
@ApiExtraModels(ResponsePaginationDto, ResponsePaginationObjDto, CreateDocumentDto, UpdateDocumentDto)
export class DocumentsController extends BaseController {
  @Inject(DocumentService)
  private readonly documentService: DocumentService

  @Inject(FindGroupOrFailPipeService)
  private readonly findGroupOrFailService: FindGroupOrFailPipeService

  @Inject(FindDocumentOrFailPipeService)
  private readonly findDocumentOrFailService: FindDocumentOrFailPipeService

  @Post('/groups/:id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        fileId: { type: 'number' },
      },
    },
  })
  @ApiOperation({
    summary: 'Create new document inside group.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document inside group was successfully created.',
  })
  @UseInterceptors(FileInterceptor('file', storage))
  @ApiPaginateObjDto({ status: 200, description: 'The document was successfully created.', type: ResponseDocumentDto })
  async create(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() uploadedFile: Express.Multer.File,
  ) {
    try {
      const group = await this.findGroupOrFailService.transform(id)
      let document = await this.documentService.create(createDocumentDto, uploadedFile, group)
      document = await this.findDocumentOrFailService.transform(document.id)
      return this.success(res, document.toResponse)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all documents.',
  })
  @ApiResponse({
    status: 200,
    description: 'All documents were successfully returned.',
  })
  @ApiPaginateDto({ status: 200, description: 'All documents were successfully returned.', type: ResponseDocumentDto })
  async findAll(@Req() req, @Res() res: Response) {
    try {
      const documents = await this.documentService.findAll(req)
      return this.success(res, documents)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one document.',
  })
  @ApiResponse({
    status: 200,
    description: 'The document was successfully returned.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The document was successfully returned.', type: ResponseDocumentDto })
  findOne(@Param('id', ParseIntPipe, FindDocumentOrFailPipeService) document: Document, @Res() res: Response) {
    try {
      return this.success(res, document.toResponse)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Put(':id/rename')
  async rename(
    @Res() res: Response,
    @Body() updateDto: UpdateAttachmentDto,
    @Param('id', ParseIntPipe, FindDocumentOrFailPipeService) document: Document,
  ) {
    try {
      await this.documentService.rename(document, updateDto)
      return this.success(res, {})
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update one document.',
  })
  @ApiResponse({
    status: 200,
    description: 'The document was successfully updated.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The document was successfully updated.', type: ResponseDocumentDto })
  async update(
    @Res() res: Response,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Param('id', ParseIntPipe, FindDocumentOrFailPipeService) document: Document,
  ) {
    try {
      const updatedDocument = await this.documentService.update(document, updateDocumentDto)
      return this.success(res, updatedDocument.toResponse)
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete one document.',
  })
  @ApiResponse({
    status: 200,
    description: 'The document was successfully deleted.',
  })
  @ApiPaginateObjDto({ status: 200, description: 'The document was successfully deleted.', type: ResponseDocumentDto })
  async remove(@Param('id', ParseIntPipe, FindDocumentOrFailPipeService) document: Document, @Res() res: Response) {
    try {
      await this.documentService.remove(document)
      return this.success(res, {})
    } catch (err) {
      return this.error(res, err.message)
    }
  }
}
