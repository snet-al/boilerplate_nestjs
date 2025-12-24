# Guards (`common/guards/`)

## Overview

This folder contains shared guards that can be used across the application. Guards determine whether a request should be handled by a route handler based on certain conditions (authentication, authorization, rate limiting, etc.).

## Current Guards

### RateLimitGuard

Limits the number of requests a user can make within a time window to prevent abuse. Configured with max requests per window and window duration.

## Rules and Guidelines

### Creating New Guards

- Implement `CanActivate` interface
- Access request/response via `context.switchToHttp()`
- Throw appropriate HTTP exceptions instead of returning false
- Use `@UseGuards()` decorator at controller or method level
- Multiple guards can be chained with `@UseGuards(Guard1, Guard2)`
- Global guards can be registered in `main.ts`

### Guard Types

- Authentication guards: Check if user is authenticated
- Authorization guards: Check if user has permission
- Rate limiting guards: Prevent abuse
- Validation guards: Less common, usually use pipes instead

## Important Guidelines

- Always implement `CanActivate` interface for NestJS guards
- Access request/response via `context.switchToHttp().getRequest()` and `getResponse()`
- Throw appropriate HTTP exceptions instead of returning false:
  - `UnauthorizedException` for authentication failures
  - `ForbiddenException` for authorization failures
- Use multiple guards with `@UseGuards(Guard1, Guard2)` for composition
- Guards execute in order - authentication guards should come first
- Use `Promise<boolean>` return type for async operations
- Log important guard decisions using `Logger` for debugging
- Make guards configurable via constructor parameters - don't hardcode values
- Make guards injectable services using `@Injectable()` decorator
- For in-memory rate limiting, clean up old entries periodically
- Identify users consistently (userId, IP, etc.) for rate limiting and tracking
