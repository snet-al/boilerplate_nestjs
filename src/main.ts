import 'reflect-metadata'
require('dotenv').config()
import { join } from 'path'
import { ObjectLiteral } from 'typeorm'
import { AppModule } from './app.module'
import { NestFactory } from '@nestjs/core'
import * as basicAuth from 'express-basic-auth'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import { localAuthMiddleware } from './middleware/local_auth.middleware'
import { mdcMiddleware } from './common/mdc/mdc.middleware'

/**
 * Micro-App Registry
 * Add new modules here to run them as standalone micro-apps.
 * Usage: APP_MODE=<micro-app-name> npm run start
 */
const APP_REGISTRY = {
  main: { module: AppModule, port: 5000, name: 'Main API' },
  // jobs:     { module: JobsModule,     port: 5001, name: 'Jobs Worker' },
  // analytics:{ module: AnalyticsModule,port: 5002, name: 'Analytics Service' },
  // Add more micro-apps here...
}

async function bootstrap() {
  const mode = process.env.APP_MODE || 'main'
  const config = APP_REGISTRY[mode] || APP_REGISTRY.main

  const port = Number(process.env.PORT) || config.port
  const app = await NestFactory.create<NestExpressApplication>(config.module)

  app.use(mdcMiddleware)
  app.enableCors()

  // Main API specific config (skip for micro-apps)
  if (mode === 'main') {
    app.useStaticAssets(join(__dirname, '..', 'public'))
    app.use(localAuthMiddleware)

    if (process.env.SWAGGER_USER && process.env.SWAGGER_PASSWORD) {
      const users: ObjectLiteral = {}
      users[process.env.SWAGGER_USER] = process.env.SWAGGER_PASSWORD
      app.use(
        ['/docs', '/docs-json'],
        basicAuth({
          challenge: true,
          users,
        }),
      )
      const config = new DocumentBuilder()
        .addBearerAuth()
        .addServer(process.env.HOST)
        .setTitle('NestJs API Docs')
        .setDescription('The API descriptions')
        .setVersion('1.0')
        .addTag('nestjs')
        .build()
      const document = SwaggerModule.createDocument(app, config)
      SwaggerModule.setup('docs', app, document)
    }
  }

  await app.listen(port)
  const exposedPort = process.env.EXPOSED_PORT || port
  console.log(`[${config.name}] listening at: http://localhost:${exposedPort}`)
}

bootstrap()
