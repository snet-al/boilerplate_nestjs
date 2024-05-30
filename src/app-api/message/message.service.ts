import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../../entities/message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async createMessage(data: any) {
    let messageData = data;

    // Check if data is a string and try to parse it
    if (typeof data === 'string') {
      try {
        messageData = JSON.parse(data);
      } catch (err) {
        throw new Error('Invalid data: expected an object or a JSON string.');
      }
    }

    const message = new this.messageModel(messageData);
    return message.save();
  }

  async getMessages() {
    return this.messageModel.find().exec()
  }

  async getDebateMessages(id) {
    return this.messageModel.find({ debateId: id }).exec()
  }
}