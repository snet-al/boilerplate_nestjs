import { Module } from '@nestjs/common'
import { MessageGateway } from './message.gateway'
import { MessagesController } from './message.controller'
import { MessageService } from './message.service'
import { Message, MessageSchema } from 'src/entities/message.entity'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  providers: [MessageGateway, MessageService],
  controllers: [MessagesController],
  exports: [],
})
export class MessageModule {}