import { In, LessThanOrEqual, Repository } from 'typeorm'
import { Cron, Interval } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Inject, Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class JobsService {
  @Inject(MailerService)
  private mailerService: MailerService

  @Cron('0 0 8 * * *')
  async sendCronEmail() {
    this.mailerService
      .sendMail({
        to: 'johndoe@gmail.com',
        subject: 'Weekly Email',
        template: './templates/email/sample',
        context: {
          name: 'John Doe',
        },
      })
      .catch((err) => {
        throw err
      })
  }
}
