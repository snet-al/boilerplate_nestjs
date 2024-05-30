import {
  Controller,
  Res,
  HttpStatus,
  Get,
  Query,
  Post,
  Body, Inject, Req, Param,
} from '@nestjs/common'
import { Response } from 'express'
import { MessageService } from './message.service'
import { Message } from 'src/entities/message.entity'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ApiPaginateDto } from '../../common/dto/pagination.dto'
import { BaseController } from '../base.controller'
import { ResponseMessageDto } from './dto/response-message.dto'


// @UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController extends BaseController {
  @Inject(MessageService)
  private messageService: MessageService


  @Get('/')
  @ApiOperation({
    summary: 'Get all messages of the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'All messages successfully returned.',
  })
  @ApiPaginateDto({ status: 200, description: 'All clients were successfully returned.', type: ResponseMessageDto  })
  async findAll(@Req() req, @Res() res: Response) {
    try {
      const messages = await this.messageService.getMessages()
      return res.status(HttpStatus.OK).json(messages);
    } catch (err) {
      return this.error(res, err.message)
    }
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get all messages of debate.',
  })
  @ApiResponse({
    status: 200,
    description: 'All messages successfully returned.',
  })
  @ApiPaginateDto({ status: 200, description: 'All clients were successfully returned.', type: ResponseMessageDto  })
  async findDebateMessages(@Req() req, @Res() res: Response, @Param('id') id: string) {
    try {
      const messages = await this.messageService.getDebateMessages(id)
      return res.status(HttpStatus.OK).json(messages);
    } catch (err) {
      return this.error(res, err.message)
    }
  }

}
