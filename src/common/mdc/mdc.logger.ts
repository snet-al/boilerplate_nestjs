import { Logger } from '@nestjs/common'
import { MdcService } from './mdc.service'
import { MDC_KEYS } from './mdc.constants'

export class MdcLogger extends Logger {
  constructor(private readonly mdc: MdcService, context?: string) {
    super(context)
  }

  private prefix(): string {
    const rid = this.mdc.get<string>(MDC_KEYS.requestId)
    const uid = this.mdc.get<string>(MDC_KEYS.userId)
    return `[rid=${rid || '-'} uid=${uid || '-'}] `
  }

  log(message: any, context?: string) { super.log(this.prefix() + message, context) }
  error(message: any, trace?: string, context?: string) { super.error(this.prefix() + message, trace, context) }
  warn(message: any, context?: string) { super.warn(this.prefix() + message, context) }
  debug(message: any, context?: string) { super.debug(this.prefix() + message, context) }
  verbose(message: any, context?: string) { super.verbose(this.prefix() + message, context) }
}


