import { Injectable } from '@nestjs/common'
import { getNamespace, createNamespace } from 'cls-hooked'
import { CLS_NAMESPACE } from './mdc.constants'

@Injectable()
export class MdcService {
  private ns = getNamespace(CLS_NAMESPACE) || createNamespace(CLS_NAMESPACE)

  set<T = any>(key: string, value: T) {
    this.ns.set(key, value)
  }

  get<T = any>(key: string): T | undefined {
    return this.ns.get(key)
  }
}


