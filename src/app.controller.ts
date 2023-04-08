import { Controller, Get, Render } from '@nestjs/common'

@Controller()
export class AppController {
  constructor() {}

  @Get('/')
  @Render(__dirname + '/public/index.html')
  index() {
    return 'index'
  }
}
