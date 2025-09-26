import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common'

interface RateLimitEntry {
  count: number
  resetTime: number
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name)
  private readonly requests = new Map<string, RateLimitEntry>()
  private readonly maxRequests = 6 // Max requests per window
  private readonly windowMs = 60 * 1000 // 1 minute in milliseconds

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    
    if (!user || !user.userId) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED)
    }

    const userId = user.userId.toString()
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Clean up old entries
    this.cleanupOldEntries(windowStart)

    // Get or create user entry
    let userEntry = this.requests.get(userId)
    
    if (!userEntry || userEntry.resetTime <= now) {
      // Create new window for user
      userEntry = {
        count: 0,
        resetTime: now + this.windowMs
      }
      this.requests.set(userId, userEntry)
    }

    // Check if user has exceeded rate limit
    if (userEntry.count >= this.maxRequests) {
      const retryAfter = Math.ceil((userEntry.resetTime - now) / 1000)
      this.logger.warn(`Rate limit exceeded for user ${userId}. Retry after ${retryAfter} seconds`)
      
      throw new HttpException(
        {
          message: 'Rate limit exceeded. Too many refresh requests.',
          retryAfter: retryAfter,
          maxRequests: this.maxRequests,
          windowSeconds: this.windowMs / 1000
        },
        HttpStatus.TOO_MANY_REQUESTS
      )
    }

    // Increment request count
    userEntry.count++
    this.requests.set(userId, userEntry)

    this.logger.debug(`User ${userId} refresh request ${userEntry.count}/${this.maxRequests}`)
    return true
  }

  private cleanupOldEntries(windowStart: number): void {
    for (const [userId, entry] of this.requests.entries()) {
      if (entry.resetTime <= windowStart) {
        this.requests.delete(userId)
      }
    }
  }
}
