import { Response } from 'express'
import { Injectable, HttpStatus, Res } from '@nestjs/common'

@Injectable()
export class BaseController {
  async response(httpStatus: any, status: string, data: Object, @Res() res) {
    let meta = { total: 0 }
    let results = data
    if (data && data[1] != undefined) {
      results = data[0]
      meta.total = data[1]
    }
    return res.status(httpStatus).json({
      status: status,
      data: results,
      meta,
    })
  }

  async success(@Res() res: Response, data: Object) {
    return this.response(HttpStatus.OK, 'success', data, res)
  }

  async error(@Res() res: Response, message?: string) {
    message = message || 'Something went wrong'
    return this.response(HttpStatus.BAD_REQUEST, message, '', res)
  }

  async notFound(@Res() res: Response, message?: string) {
    return this.response(HttpStatus.NOT_FOUND, message, '', res)
  }
}
