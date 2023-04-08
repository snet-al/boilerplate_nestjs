import { Request, Response, NextFunction } from 'express'

export function localAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  req.query.__token = 'x'
  req.query.__pass = 'x'
  next()
}
