# Common Module (`common/`)

## Overview

The `common/` folder contains shared utilities, services, guards, filters, DTOs, and middleware used across multiple app modules. Code placed here should be reusable across the application.

## Structure

```
common/
├── common.module.ts              # Common module configuration
├── pagination.service.ts         # Pagination utility service
├── dto/                          # Shared DTOs
├── guards/                       # Shared guards
├── services/                     # Shared services
├── filters/                      # Exception filters
└── exceptions/                   # Custom exceptions
```

## Key Components

### Pagination Service

Provides standardized pagination logic for repositories and query builders. Handles pagination query parameters and sorting.

### Rate Limit Guard

Protects endpoints from abuse by limiting requests per user per time window. Located in `guards/` folder.

### Shared Services

Services for external system integration and shared business logic. Located in `services/` folder.

## Rules and Guidelines

### When to Add Code to Common

Add to common when:
- Code is used by 2+ app modules
- Code provides cross-cutting concerns (logging, validation, etc.)
- Code implements shared utilities or helpers

Don't add to common when:
- Code is specific to one module (keep it in that module)
- Code is a one-off utility (consider if it will be reused)

### Creating Shared Services

- Create service in `services/` folder
- Export from `CommonModule` to make it available to other modules
- Import `CommonModule` in app modules where the service is needed
- Follow existing service patterns (HTTP client injection, config injection)

### Creating Shared Guards

- Create guard in `guards/` folder
- Must implement `CanActivate` interface
- Use `@UseGuards()` decorator in controllers
- Can be registered globally in `main.ts` if needed

### Creating Shared DTOs

- Create DTO in `dto/` folder
- Use `@ApiProperty()` decorators for Swagger
- Use `class-validator` decorators for validation
- Import where needed in other modules

### CommonModule Configuration

The `CommonModule` follows this pattern:

**Providers array:** Contains all services, guards, utilities that should be available
**Exports array:** Contains only what should be accessible to other modules (services, utilities, etc.)

Structure:
- Add services to both `providers` and `exports` if they should be used by other modules
- Add services only to `providers` if they're internal to CommonModule
- Import `CommonModule` in app modules where shared services are needed
- Only export what other modules actually need - keep exports minimal

## Important Guidelines

- Only add code that will be used in multiple modules
- Export services/utilities from CommonModule to make them available
- Import CommonModule in app modules to use shared services
- Always use PaginationService for pagination logic
- Use RateLimitGuard for endpoints that need protection
- Follow existing service patterns
- Handle errors gracefully in shared services
- Shared code should be well-tested since it's used in multiple places
