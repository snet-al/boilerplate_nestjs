import {
  WebSocketGateway,
  OnGatewayConnection,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MessageService } from './message.service';

@WebSocketGateway({ namespace: 'message', cors: true, allowEIO3: true })
export class MessageGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  constructor(private messageService: MessageService) {}

  handleConnection(client: any, ...args: any[]) {
    console.log('New connection', client.id);
  }

  @SubscribeMessage('new-message-to-server')
  async handleMessage(@MessageBody() data: any) {
    console.log('Received message', data);

    // Save the message to MongoDB
    const savedMessage = await this.messageService.createMessage(data);
    console.log('Saved message', savedMessage);
  }
}