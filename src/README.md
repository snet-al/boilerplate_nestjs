# Source Directory (`src/`)

## Overview

This is the root source directory for the NestJS application. The project follows a **micro backend architecture** where each functional domain is organized as a separate module (indicated by `app-*` prefixes).

## Architecture

This NestJS application uses a modular architecture pattern:

- **App Modules** (`app-*` folders): Feature-based modules that group related functionality
- **Common** (`common/`): Shared utilities, services, guards, filters, and DTOs used across modules
- **Entities** (`entities/`): TypeORM database entity definitions
- **Middleware** (`middleware/`): Express middleware functions
- **Migrations** (`migrations/`): TypeORM database migration files

## Directory Structure

```
src/
├── app-analytics/      # Analytics tracking and reporting module
├── app-api/            # API key management and client resources module
├── app-auth/           # Authentication and authorization module
├── app-budget/         # User budget management module
├── app-documents/      # Document management module (files, attachments, groups)
├── app-jobs/           # Background jobs and scheduled tasks module
├── common/             # Shared utilities, services, guards, filters
├── entities/           # TypeORM entity definitions
├── middleware/         # Express middleware
├── migrations/         # Database migrations
├── templates/          # Email templates (Handlebars)
├── app.controller.ts   # Root application controller
├── app.module.ts       # Root application module
├── main.ts             # Application entry point
└── ormconfig.ts        # TypeORM configuration
```

## Rules and Guidelines

### 1. Creating New Modules

**When to create a new `app-*` module:**
- When adding a completely new feature domain that doesn't fit into existing modules
- When the new functionality is large enough to warrant its own module
- When the feature needs to be independently deployable or testable

**How to create:**
```bash
npx @nestjs/cli g module app-<name>
```

**What to include:**
- A module file: `app-<name>.module.ts` that imports all feature modules
- Feature modules/resources organized by functionality
- Register your new `App<Name>Module` in `app.module.ts` imports array

### 2. Module Naming Conventions

- **App modules**: Use `app-<name>` format (e.g., `app-auth`, `app-api`)
- **Feature modules**: Use descriptive names (e.g., `auth.module.ts`, `user.module.ts`)
- **Services**: `<name>.service.ts`
- **Controllers**: `<name>.controller.ts` (plural for resource controllers)
- **DTOs**: Place in `dto/` subfolder with descriptive names (e.g., `create-user.dto.ts`)

### 3. Importing Between Modules

- **Avoid circular dependencies**: Design module boundaries carefully
- **Use exports properly**: Only export what other modules need from `CommonModule`
- **Import in app modules**: Each `app-*.module.ts` should import its feature modules
- **Root module**: `app.module.ts` imports all `App*Module` classes

### 4. Shared Code

- **Use `common/` folder**: For code shared across multiple app modules
- **Don't duplicate**: If you need something in multiple modules, put it in `common/`
- **CommonModule**: Provides shared services, guards, filters, and utilities

### 5. Database Entities

- **Location**: All entities go in `entities/` folder
- **Naming**: `<name>.entity.ts`
- **Inheritance**: Extend `BasicEntity` for standard fields (id, timestamps, soft delete)
- **Usage**: Import entities in feature modules via `TypeOrmModule.forFeature([Entity])`

### 6. Migrations

- **Location**: All migrations go in `migrations/` folder
- **Naming**: `<timestamp>-<descriptive-name>.ts`
- **Generation**: Run `npm run build` first, then `npm run migration:generate --name=<name>`
- **Running**: Use `npm run migration:run`

### 7. Code Organization Within Modules

Each feature/resource within an `app-*` module should follow this structure:

```
<feature>/
├── dto/                    # Data Transfer Objects
│   ├── create-<feature>.dto.ts
│   ├── update-<feature>.dto.ts
│   └── response-<feature>.dto.ts
├── pipe/                   # Custom pipes (e.g., find-or-fail pipes)
├── helpers/                # Helper functions/classes (optional)
├── interfaces/             # TypeScript interfaces (optional)
├── <feature>.controller.ts # Controller (extends BaseController for API modules)
├── <feature>.service.ts    # Business logic
└── <feature>.module.ts     # Module definition
```

### 8. Response Format

- **API modules**: Use `BaseController` from `app-api/base.controller.ts` for consistent responses
- **Response shape**: `{ status: string, data: any, meta: { total: number } }`
- **List endpoints**: Return `[rows, total]` tuple to auto-populate `meta.total`

### 9. Authentication & Authorization

- **Guards**: Use `JwtAuthGuard` from `app-auth/guards/jwt-auth.guard.ts`
- **Strategies**: JWT and Local strategies in `app-auth/strategies/`
- **Middleware**: Use `mdcMiddleware` for request context (request ID, user info)

### 10. Testing

- **Unit tests**: Co-locate with source files as `*.spec.ts`
- **E2E tests**: Place in `test/` directory
- **Test structure**: Follow NestJS testing patterns with `@nestjs/testing`

## Common Patterns

When creating a new resource in an app module:
1. Create entity in `entities/` extending `BasicEntity`
2. Create DTOs in `dto/` subfolder
3. Create service with TypeORM repository
4. Create controller extending `BaseController` (for API modules)
5. Create module wiring everything together
6. Import module in the app module (e.g., `AppApiModule`)

## Dependencies

- **NestJS Core**: Framework foundation
- **TypeORM**: Database ORM
- **Passport**: Authentication
- **Swagger**: API documentation
- **class-validator**: DTO validation
- **class-transformer**: Object transformation

## Important Files

- **`app.module.ts`**: Root module - imports all app modules and global config
- **`main.ts`**: Application bootstrap - configures CORS, Swagger, middleware
- **`ormconfig.ts`**: Database configuration from environment variables

## General Guidelines

When working in this codebase, follow these principles:

- Check existing similar modules/resources before creating new ones
- For API endpoints, always extend `BaseController` from `app-api/base.controller.ts`
- All entities should extend `BasicEntity` unless there's a specific reason not to
- Use `class-validator` decorators on all DTOs
- Add `@ApiProperty()` to DTOs and use Swagger decorators in controllers
- Use `BaseController.success()`, `error()`, and `notFound()` methods for responses
- Follow existing TypeORM repository and query builder patterns
- Respect module boundaries - avoid tight coupling between app modules
- Before adding new features, review similar implementations to understand patterns
- Before creating new utilities, check if something similar exists in `common/`

