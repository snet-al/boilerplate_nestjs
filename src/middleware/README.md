# Middleware (`middleware/`)

## Overview

The `middleware/` folder contains Express middleware functions used in the application. Middleware functions execute before route handlers and can modify the request/response objects or terminate the request-response cycle.

## Current Middleware

### Local Auth Middleware

Middleware for local authentication (if needed). Currently, most authentication is handled via Passport strategies and guards.

## Rules and Guidelines

### Creating New Middleware

- Express middleware signature: `(req: Request, res: Response, next: NextFunction) => void`
- Class-based middleware: Implement `NestMiddleware` interface
- Register in `main.ts` for global middleware or in modules for route-specific middleware

### Middleware Order

Middleware execution order matters:
1. Global middleware (registered in `main.ts`) - MDC, CORS, body parsers
2. Module middleware (registered in modules) - route-specific
3. Guards (route-level)
4. Interceptors
5. Route handlers

### Common Use Cases

- Request logging
- Authentication/authorization
- Request modification (add IDs, parse data, add defaults)
- Validation
- Rate limiting

## Important Guidelines

- Always call `next()` unless terminating the request - don't call `next()` after sending a response
- Register middleware in correct order: global middleware in `main.ts` first (MDC, CORS, body parsers), then module-specific middleware
- Pass errors to `next(err)` for error handlers to catch
- Use async/await and handle errors with try-catch for async operations
- Extend Express types if adding custom properties to req/res - use TypeScript declaration merging with `declare global` and `namespace Express`
- Each middleware should have a single responsibility
- Make middleware configurable and reusable
- Keep middleware lightweight, avoid heavy operations
- Document what each middleware does
- For class-based middleware: Implement `NestMiddleware` interface and use `configure()` method in modules
- Test middleware in isolation and integration
