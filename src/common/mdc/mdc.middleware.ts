import { randomUUID } from 'crypto'
import { Request, Response, NextFunction } from 'express'
import { getNamespace, createNamespace } from 'cls-hooked'
import { CLS_NAMESPACE, MDC_KEYS } from './mdc.constants'

export function mdcMiddleware(req: Request, _res: Response, next: NextFunction) {
  const ns = getNamespace(CLS_NAMESPACE) || createNamespace(CLS_NAMESPACE)
  ns.run(() => {
    ns.set(MDC_KEYS.requestId, randomUUID())
    const u: any = (req as any).user
    if (u) {
      ns.set(MDC_KEYS.userId, u.userId || u.id)
      ns.set(MDC_KEYS.email, u.email)
    }
    next()
  })
}


