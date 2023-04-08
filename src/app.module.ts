import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppApiModule } from './app-api/app-api.module'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { AppAuthModule } from './app-auth/app-auth.module'
import { AppDocumentsModule } from './app-documents/app-documents.module'
import { MailerModule } from '@nestjs-modules/mailer'
import { AppJobsModule } from './app-jobs/app-jobs.module'

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    AppAuthModule,
    AppApiModule,
    AppDocumentsModule,
    AppJobsModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.MAILER_HOST,
        port: parseInt(process.env.MAILER_PORT),
        secure: process.env.MAILER_TLS == 'true' || false,
        auth: {
          user: process.env.MAILER_USER,
          pass: process.env.MAILER_PASS,
        },
      },
      defaults: {
        from: process.env.MAILER_SENDER,
      },
      template: {
        dir: process.cwd() + '/templates/email',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
