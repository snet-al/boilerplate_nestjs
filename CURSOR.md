# Cursor AI Development Guide

This is a comprehensive guide for AI assistants working on this NestJS boilerplate project. It consolidates all patterns, conventions, and step-by-step instructions needed to solve development tasks.

---

## Table of Contents

1. [Project Overview & Architecture](#project-overview--architecture)
2. [Quick Reference Checklist](#quick-reference-checklist)
3. [Creating a New API Resource (Complete Guide)](#creating-a-new-api-resource-complete-guide)
4. [Entity Creation Patterns](#entity-creation-patterns)
5. [Migration Management](#migration-management)
6. [Common Patterns & Conventions](#common-patterns--conventions)
7. [Module-Specific Guidelines](#module-specific-guidelines)
8. [Authentication & Security](#authentication--security)
9. [Development Setup](#development-setup)
10. [Environment Variables Reference](#environment-variables-reference)

---

## Project Overview & Architecture

### Architecture Pattern

This NestJS application uses a **micro backend architecture** where each functional domain is organized as a separate module (indicated by `app-*` prefixes). This is an example of how the architecture is structured.

### Directory Structure

```
src/
├── app-analytics/      # Analytics tracking and reporting module
├── app-api/            # API key management and client resources module
├── app-auth/           # Authentication and authorization module
├── app-budget/         # User budget management module
├── app-documents/      # Document management module (files, attachments, groups)
├── app-jobs/           # Background jobs and scheduled tasks module
├── common/             # Shared utilities, services, filters
├── entities/           # TypeORM entity definitions
├── middleware/         # Express middleware
├── migrations/         # Database migrations
├── templates/          # Email templates (Handlebars)
├── app.controller.ts   # Root application controller
├── app.module.ts       # Root application module
├── main.ts             # Application entry point
└── ormconfig.ts        # TypeORM configuration
```

### Module Organization

- **App Modules** (`app-*` folders): Apps are the top level modules that group together a set of domain level modules, and are the smallest deployable unit that if separated by other apps (micro-apps) can still function. Example: `app-api` (see `src/app-api/` for structure with CRUD modules like `client/` and `keys/`)
- **CRUD Modules** (inside `app-*` folders): Every CRUD inside an `app-{appName}` is the second level of modules and the lowest level. These are domain-specific modules that handle specific resources (e.g., `client`, `keys` inside `app-api`)
- **Entities** (`entities/`): TypeORM database entity definitions. Grouping entities in a single place and not in every nest module helps separate the bindings between modules
- **Middleware** (`middleware/`): Express middleware functions
- **Migrations** (`migrations/`): TypeORM database migration files

### Key Principles

- **Modularity**: Each micro-app is a separate `app-*` module (the smallest possible deployable unit). Every CRUD inside an `app-{appName}` is the second level of modules and the lowest level.
- **Consistency**: All API controllers extend `BaseController` for standardized responses
- **Type Safety**: Use TypeORM entities, DTOs with validation, and find-or-fail pipes
- **Documentation**: All DTOs use `@ApiProperty()` for Swagger

---

## Quick Reference Checklist

When creating a new API resource, follow this checklist:

- [ ] **Entity**: Create `src/entities/<feature>.entity.ts` extending `BasicEntity`; add `baseGroup` or `toResponse` getters
- [ ] **DTOs**: Create `Create<Feature>Dto`, `Update<Feature>Dto`, `Response<Feature>Dto` with `@ApiProperty`
- [ ] **Service**: Create `<feature>.service.ts` with TypeORM repository access and pagination via `PaginationService`
- [ ] **Find-or-fail pipe**: Create `pipe/find-<feature>-or-fail-pipe.service.ts` to resolve `:id` params to entities
- [ ] **Controller**: Create `<features>.controller.ts` extending `BaseController`; wire routes and Swagger decorators; use the pipe in `@Param`
- [ ] **Module**: Create `<feature>.module.ts` registering `TypeOrmModule.forFeature`, service, pipe, and `PaginationService`
- [ ] **Register module**: Import your module in the appropriate app module (e.g., `AppApiModule`)
- [ ] **Auth (optional)**: Protect endpoints via `@UseGuards(JwtAuthGuard)` and add `@ApiBearerAuth()`

---

## Creating a New API Resource

Follow the **Quick Reference Checklist** above for the step-by-step process. For complete code examples, refer to existing CRUD modules in the codebase:

- **`src/app-api/client/`** - Complete CRUD module example with entity, DTOs, service, controller, pipe, and module
- **`src/app-api/keys/`** - Another example of a CRUD module structure

These examples demonstrate all the patterns and conventions used in this project.

---

## Entity Creation Patterns

### Basic Entity Structure

All entities should extend `BasicEntity` which provides:
- `id`: Primary key
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp
- `deletedAt`: Soft delete timestamp

### Entity Examples

For entity examples, refer to existing entities in the codebase:
- **`src/entities/document.entity.ts`** - Example entity with relationships and response getters
- **`src/entities/client.entity.ts`** - Another example entity structure

### Relationships

For relationship examples, refer to existing entities:
- **Many-to-One**: `src/entities/file.entity.ts` (File → Document), `src/entities/users_roles.entity.ts` (UsersRoles → User, UsersRoles → Role)
- **One-to-Many**: `src/entities/document.entity.ts` (Document → File), `src/entities/file.entity.ts` (File → Attachment)
- **Many-to-Many**: `src/entities/users_roles.entity.ts` (intermediate entity pattern)

### Response Getters

- **`baseGroup`**: Lightweight subset for lists/groups (common pattern)
- **`toResponse`**: Full, client-safe view (including relations)
- **Never include**: Passwords, tokens, or sensitive data

### Column Types

Common TypeORM column types: `varchar`, `text`, `integer`, `decimal`, `float`, `boolean`, `date`, `datetime`, `timestamp`, `json`, `enum`

**Enum Example:**
- See `src/entities/document.entity.ts` for `DocumentStatus` enum usage
- See `src/entities/file.entity.ts` for enum examples

**JSON Column Example:**
- See `src/entities/file.entity.ts` for `data` column with `simple-json` type

### Important Entity Guidelines

- Always extend `BasicEntity` unless there's a specific reason not to
- Entity files are typically placed in `entities/` folder (not in app-* folders) to be used across the app
- Use snake_case for database column names
- Use camelCase for TypeScript property names
- Always specify `type` explicitly in `@Column()`
- Mark nullable columns with `nullable: true`
- Always specify `@JoinColumn({ name: 'foreign_key_name' })` for relationships
- Implement `baseGroup` getter for list views
- Implement `toResponse` getter for single object endpoints
- Never include passwords or tokens in response getters
- Define enums separately, use string columns with enum values
- Add indexes for frequently queried columns using `@Index()` decorator

---

## Migration Management

### Creating Migrations

**Manual Creation (Preferred):**
1. Create new file in `migrations/` folder with name: `<timestamp>-<DescriptiveName>.ts`
2. Use current timestamp in milliseconds (e.g., `Date.now()` or follow existing timestamp pattern)
3. Use descriptive, PascalCase name (e.g., `AddExternalUserFields`, `CreateApiKeysTable`)

### Migration File Template

For migration examples, refer to existing migration files in `src/migrations/`:
- `1673456789123-AddExternalUserFields.ts` - Example of adding columns
- `1679999999999-CreateApiKeys.ts` - Example of creating tables
- `1725530000000-CreateUserBudget.ts` - Another table creation example

**Key Requirements:**
- Class name format: `<DescriptiveName><Timestamp>` (PascalCase)
- `name` property: Must exactly match class name as string
- Both `up()` and `down()` methods are required
- `down()` must perfectly reverse all changes made in `up()`

### Migration Commands

- Generate migration: `npm run build` then `npm run migration:generate --name=<name>`
- Create manually: `npm run migration:create ./src/migrations/nameOfTheMigration`
- Run migrations: `npm run migration:run`
- Revert last: `npm run migration:revert`

### Migration Best Practices

- Always implement `down()` - make migrations reversible
- Test migrations: test `up()`, test `down()`, test on copy of production data
- Use descriptive names: `AddExternalUserFields`, `CreateApiKeys`, etc.
- One change per migration - keep migrations focused and atomic
- Handle existing data when adding/modifying columns
- Never modify migrations that have run in production - create a new migration instead
- Provide defaults when adding NOT NULL columns to existing tables
- For foreign key relationships: Create foreign key constraints after creating both tables
- TypeORM handles transactions automatically, but be aware of transaction boundaries
- Create indexes in separate migrations for clarity
- Use `queryRunner.query()` for raw SQL when needed
- Use `queryRunner.createForeignKey()` and `queryRunner.dropForeignKey()` for foreign key operations

---

## Common Patterns & Conventions

### 1. Standard Response Wrapper via BaseController

Controllers extend `BaseController` (`src/app-api/base.controller.ts`) and call:
- `success(res, data)` → returns `{ status: 'success', data, meta: { total } }`
- `error(res, message?)` → returns `{ status: '<message>', data: '', meta: { total: 0 } }` with 400
- `notFound(res, message?)` → returns 404

For list endpoints, returning `[rows, total]` (e.g., TypeORM `findAndCount()` or QueryBuilder `getManyAndCount()`) allows `BaseController` to automatically set `data = rows` and `meta.total = total`.

**Why:** This guarantees a consistent response envelope across all endpoints and makes Swagger documentation predictable.

### 2. Pagination Service

`src/common/pagination.service.ts` centralizes pagination logic.

**Two usage modes:**
- `paginateQueryBuilder(qb, req)` for QueryBuilder-based queries (adds `take`, `skip`, and optional `order`)
- `paginate({}, req)` to build `take/skip/order` options for repository `.findAndCount()`

**Request query params:**
- `page` (default 1), `pageSize` (default 20), `sortBy`, `sortOrder` (default `ASC`)

**Usage in services:**
- See `src/app-api/client/client.service.ts` for PaginationService usage with QueryBuilder
- See `src/app-api/keys/keys.service.ts` for pagination examples

**Why:** This keeps pagination consistent and keeps controllers/services focused on business logic.

### 3. Find-or-Fail Pipes for Param Binding

For each entity, create a `Find<Entity>OrFailPipeService` pipe under the feature folder.

**Usage in controllers:**
- See `src/app-api/client/client.controller.ts` for usage examples
- See `src/app-api/client/pipe/find-client-or-fail-pipe.service.ts` for pipe implementation

Transforms `:id` params directly into loaded entities and throws `NotFoundException` if missing.

**Why:** Simplifies controllers by transforming `:id` params directly into loaded entities and throwing `NotFoundException` if missing.

### 4. Response Models and Swagger Wrappers

- Response DTOs (e.g., `ResponseClientDto`) describe the shape of the item returned in `data`
- Custom Swagger helpers:
  - `ApiPaginateDto({ type: ResponseXDto })` for list endpoints: documents `{ status, meta.total, data: type[] }`
  - `ApiPaginateObjDto({ type: ResponseXDto })` for single-item endpoints: documents `{ status, meta.total, data: type }`
- Add `@ApiExtraModels(ResponsePaginationDto, ResponsePaginationObjDto, CreateXDto, UpdateXDto)` on controllers

**Why:** Ensures Swagger/OpenAPI matches the app's consistent response envelope.

### 5. Entities with Safe Response Getters

Entities extend `BasicEntity` to inherit `id`, `createdAt`, `updatedAt`, `deletedAt`.

Implement getters for safe serialization:
- `baseGroup` for a lightweight subset
- `toResponse` for a full, client-safe view (including relations)

Controllers often return `entity.baseGroup` or `entity.toResponse` through `BaseController.success()`.

**Why:** Prevents leaking internal fields and centralizes response shape per entity.

### 6. Property Injection Style

Services and controllers commonly use `@Inject()`/`@InjectRepository()` property injection instead of constructor injection.

**Example:**
- See `src/app-api/client/client.service.ts` for property injection pattern
- See `src/app-api/keys/keys.service.ts` for another example

**Why:** A project style choice that keeps constructors minimal and mirrors Angular-like patterns.

### 7. Authentication and Guards

**Strategies:** `JwtStrategy` and `LocalStrategy` in `src/app-auth/strategies`.

**Guards:** `JwtAuthGuard` and `LocalAuthGuard` in `src/app-auth/guards`.

**Typical usage per route:**
- Add `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()` for protected routes.

Auth endpoints are in `src/app-auth/auth/auth.controller.ts` and implemented in `auth.service.ts` (login, logout, password reset, activation).

**Why:** Standard Nest Passport flow with JWT; guards are opt-in per route or controller.

### 8. File Uploads Pattern

See `src/app-documents/document/documents.controller.ts` for `FileInterceptor` usage with custom `diskStorage` to `public/uploads` and `uuid` file names.

**Why:** Provides a ready-made pattern for multipart uploads with documented schema.

### 9. App Bootstrap, Static Assets, and Swagger Security

`src/main.ts`:
- Serves static assets from `public/` (also used for uploads)
- Enables CORS
- Applies `localAuthMiddleware` (sets `req.query.__token`/`__pass`)
- Configures Swagger behind Basic Auth when `SWAGGER_USER`/`SWAGGER_PASSWORD` are set

**Why:** Makes docs protected in non-dev environments and serves the embedded `public/index.html`.

### 10. Database and Configuration

Data source config is in `src/ormconfig.ts` and pulls values from environment variables (e.g., `TYPEORM_CONNECTION`, `TYPEORM_HOST`, `TYPEORM_ENTITIES`, `TYPEORM_MIGRATIONS`).

Root module registers TypeORM: `TypeOrmModule.forRoot(ormconfiguration)` in `src/app.module.ts`.

**Why:** Environment-driven config supports multiple DB engines and flexible build setups.

**Complete file upload setup:**
- See `src/app-documents/document/documents.controller.ts` for complete file upload implementation with `FileInterceptor`, `diskStorage`, and Swagger documentation

**Notes:**
- Files are stored in `public/uploads/` directory
- Files are served as static assets via `main.ts`
- Use `uuid` to generate unique filenames
- Access uploaded file via `@UploadedFile()` decorator

### 7. Module Naming Conventions

- **App modules**: Use `app-<name>` format (e.g., `app-auth`, `app-api`)
- **Feature modules**: Use descriptive names (e.g., `auth.module.ts`, `user.module.ts`)
- **Services**: `<name>.service.ts`
- **Controllers**: `<name>.controller.ts` (plural for resource controllers)
- **DTOs**: Place in `dto/` subfolder with descriptive names (e.g., `create-user.dto.ts`)

### 8. DTO Validation with ValidationPipe

DTOs should use `class-validator` decorators for validation. Use `ValidationPipe` in controllers with appropriate options.

**Common validation decorators:**
- See `src/app-auth/user/dto/create-user.dto.ts` for validation decorator examples
- See `src/app-api/client/dto/create-client.dto.ts` for DTO validation patterns

**ValidationPipe usage in controllers:**
- See `src/app-api/client/client.controller.ts` for ValidationPipe usage examples
- See `src/app-auth/auth/auth.controller.ts` for controller-level validation patterns

**ValidationPipe options:**
- `transform: true` - Automatically transform payloads to DTO instances
- `whitelist: true` - Strip properties that don't have decorators
- `forbidNonWhitelisted: true` - Throw error if non-whitelisted properties exist

### 9. Logger Usage

Use NestJS `Logger` in services for consistent logging:
- See `src/app-api/client/client.service.ts` for Logger usage examples
- See `src/common/services/external-user-management.service.ts` for logging patterns

### 11. ConfigService for Environment Variables

Use `ConfigService` to access environment variables:
- See `src/common/services/external-user-management.service.ts` for ConfigService usage examples
- See `src/app.module.ts` for MailerModule configuration using environment variables

### 12. External API Client Pattern

For external API integrations, use `HttpService` from `@nestjs/axios`:
- See `src/common/services/external-user-management.service.ts` for complete external API integration example with `HttpService`, `ConfigService`, error handling, and transaction rollback patterns

### 13. Email Templates with Handlebars

The project uses Handlebars templates for emails via `@nestjs-modules/mailer`:

**Template location:** `templates/email/<template-name>.hbs`

**Template example:**
- See `src/templates/email/sample.hbs` or `templates/email/password-reset.hbs` for Handlebars template examples

**Sending emails:**
- See `src/app-jobs/jobs.service.ts` for MailerService usage example
- See `src/app-auth/auth/auth.service.ts` for email sending patterns in authentication flows
- See `src/app.module.ts` for MailerModule configuration

**MailerModule is configured in `app.module.ts`** - templates are in `templates/email/` directory.

### 14. Soft Deletes

Since `BasicEntity` includes `deletedAt`, entities support soft deletes:

**Soft delete:**
- See `src/app-api/client/client.service.ts` for `softRemove()` usage examples

**Querying with soft deletes:**
- See existing services for examples of querying with `withDeleted: true` option
- TypeORM automatically excludes soft-deleted records by default

### 15. QueryBuilder with Relations

Use `leftJoinAndSelect` or `innerJoinAndSelect` to load relations:
- See `src/app-documents/groups/pipe/find-group-or-fail-pipe.service.ts` for QueryBuilder with relations example
- See `src/app-api/client/client.service.ts` for QueryBuilder usage patterns

### 16. Service Return Format Variations

**Tuple format (recommended for BaseController):**
- See `src/app-api/client/client.service.ts` for tuple format `[items, total]` return examples
- See `src/app-api/keys/keys.service.ts` for service return format patterns

**Note:** BaseController automatically handles tuple format `[items, total]`. If you need to map/transform items, map them first, then return as tuple `[mappedItems, total]`. This keeps the response format consistent.

### 17. HTTP Exceptions

Use appropriate HTTP exceptions for error handling:
- See `src/app-api/client/pipe/find-client-or-fail-pipe.service.ts` for `NotFoundException` usage
- See `src/app-auth/auth/auth.service.ts` for various HTTP exception patterns (`ConflictException`, `UnauthorizedException`, etc.)
- See `src/app-auth/guards/jwt-auth.guard.ts` for guard exception handling

### 18. Cron Jobs Pattern

For scheduled tasks, use `@nestjs/schedule`:
- See `src/app-jobs/jobs.service.ts` for `@Cron` and `@Interval` decorator usage examples
- See `src/app-jobs/app-jobs.module.ts` for `ScheduleModule.forRoot()` configuration

### 19. Code Organization Within Modules

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

---

## Module-Specific Guidelines

### App API Module (`app-api/`)

**Key Component:** `BaseController` - All API controllers should extend this.

**Structure:**
```
app-api/
├── app-api.module.ts       # Main module
├── base.controller.ts      # Base controller with standardized response methods
├── base.resource.ts        # Base resource class (generic response wrapper)
├── client/                 # Client resource
└── keys/                   # API key management
```

**Rules:**
- Always extend `BaseController` - never create controllers without it
- Always use `this.success()`, `this.error()`, `this.notFound()` - never return raw responses
- Always use find-or-fail pipes for `:id` parameters (with `ParseIntPipe` before it)
- Register find-or-fail pipes in module providers when they use dependency injection
- Wrap service calls in try-catch blocks
- For list endpoints, return `[items, total]` tuple from service list methods
- If mapping is needed, map entities to response format (e.g., using `baseGroup`), then return `[mappedItems, total]` tuple

### App Auth Module (`app-auth/`)

**Structure:**
- `auth/`: Authentication flows (login, signup, logout, password reset, token management, account activation)
- `user/`: User CRUD operations, user profile management, user-specific endpoints, user synchronization
- `role/`: Role CRUD operations, role management, role assignment
- `guards/`: Authentication or authorization guards (must implement `CanActivate` interface)
- `strategies/`: Passport strategies (JWT, OAuth, etc.)

**Security Requirements:**
- Always hash passwords with bcrypt before storing (never store plain passwords)
- Always validate tokens - check expiration and signature on every request
- Access tokens should be short-lived, refresh tokens long-lived
- Store refresh tokens hashed in database
- Error messages should not expose sensitive information
- Never log or return passwords

**External Integration:**
- Check if `externalUserId` exists before performing external user operations
- Sync with external systems when creating users when applicable
- Handle external user creation failures gracefully (see `user.service.ts` for rollback pattern)

### Shared Utilities and Services (`common/`)

**When to Add Code to Shared Folder:**
- Code is used by 2+ app modules
- Code provides cross-cutting concerns (logging, validation, etc.)
- Code implements shared utilities or helpers

**Don't add to shared folder when:**
- Code is specific to one module (keep it in that module)
- Code is a one-off utility (consider if it will be reused)

**Shared Module Configuration:**
- Add services to both `providers` and `exports` if they should be used by other modules
- Add services only to `providers` if they're internal to the shared module
- Import the shared module in app modules where shared services are needed
- Only export what other modules actually need - keep exports minimal

**Avoiding Circular Dependencies:**
- Design module boundaries carefully to avoid circular imports
- Only export what other modules need from shared modules
- Each `app-*.module.ts` imports its feature modules
- Root module (`app.module.ts`) imports all `App*Module` classes
- If a circular dependency occurs, refactor shared code to the shared folder or create an intermediate module

### App Jobs Module (`app-jobs/`)

This micro-app is different from the general structure. It's not based on the classic structure with controller and services, as the main purpose is to offer cron job services.

**Usage:**
- Write logic inside functions in `jobs.service.ts`
- Define when cron job runs using `@Cron` decorator or `@Interval` decorator above the function
- Import `ScheduleModule.forRoot()` in the jobs module
- See "Cron Jobs Pattern" in Common Patterns section for details

### Middleware (`middleware/`)

**Middleware Order:**
1. Global middleware (registered in `main.ts`) - MDC, CORS, body parsers
2. Module middleware (registered in modules) - route-specific
3. Guards (route-level)
4. Interceptors
5. Route handlers

**Guidelines:**
- Always call `next()` unless terminating the request
- Pass errors to `next(err)` for error handlers to catch
- Use async/await and handle errors with try-catch for async operations
- Each middleware should have a single responsibility

### Guards

**Location:** Guards are located in `src/app-auth/guards/`.

**Creating Guards:**
- Implement `CanActivate` interface
- Access request/response via `context.switchToHttp()`
- Throw appropriate HTTP exceptions instead of returning false
- Use `@UseGuards()` decorator at controller or method level

**Exception Types:**
- `UnauthorizedException` for authentication failures
- `ForbiddenException` for authorization failures

**RateLimitGuard Usage:**
- See `src/app-auth/auth/auth.controller.ts` for RateLimitGuard usage examples with `@UseGuards()`

**Note:** RateLimitGuard is configured with max requests per window. Check `src/app-auth/guards/rate-limit.guard.ts` for current settings.

---

## Authentication & Security

### Authentication Flow

- **Strategies**: `JwtStrategy` and `LocalStrategy` in `src/app-auth/strategies`
- **Guards**: `JwtAuthGuard` and `LocalAuthGuard` in `src/app-auth/guards`
- **Typical usage per route:**
  - Add `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()` for protected routes

### Auth Endpoints

Auth endpoints are in `src/app-auth/auth/auth.controller.ts` and implemented in `auth.service.ts` (login, logout, password reset, activation).

### Protecting Endpoints

- See `src/app-api/client/client.controller.ts` for examples of protected endpoints with `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()`
- See `src/app-auth/auth/auth.controller.ts` for authentication endpoint patterns

### MDC (Mapped Diagnostic Context) / Request Correlation

The project includes `cls-hooked` for MDC-style request context. MDC provides per-request context for correlation IDs and user information in logs.

**Implementation Overview:**

1. **MDC Constants** (`src/common/mdc/mdc.constants.ts`):
   - Defines namespace: `CLS_NAMESPACE = 'app:mdc'`
   - Defines keys: `requestId`, `userId`, `email`

2. **MDC Service** (`src/common/mdc/mdc.service.ts`):
   - Injectable service that wraps `cls-hooked` namespace
   - Provides `set()` and `get()` methods for context values

3. **MDC Middleware** (`src/common/mdc/mdc.middleware.ts`):
   - Generates `requestId` using `uuid`
   - Extracts `userId` and `email` from `req.user` if authenticated
   - Runs in `cls-hooked` namespace context

4. **Usage in Services:**
```ts
import { Inject } from '@nestjs/common'
import { MdcService } from '../common/mdc/mdc.service'
import { MDC_KEYS } from '../common/mdc/mdc.constants'

export class ExampleService {
  @Inject(MdcService)
  private mdc: MdcService

  doWork() {
    const requestId = this.mdc.get<string>(MDC_KEYS.requestId)
    const userId = this.mdc.get<string>(MDC_KEYS.userId)
    // Use in logging or business logic
  }
}
```

**Optional: MDC-aware Logger**

File: `src/common/mdc/mdc.logger.ts`

```ts
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

  log(message: any, context?: string) {
    super.log(this.prefix() + message, context)
  }
  error(message: any, trace?: string, context?: string) {
    super.error(this.prefix() + message, trace, context)
  }
  warn(message: any, context?: string) {
    super.warn(this.prefix() + message, context)
  }
  debug(message: any, context?: string) {
    super.debug(this.prefix() + message, context)
  }
  verbose(message: any, context?: string) {
    super.verbose(this.prefix() + message, context)
  }
}
```

**Usage:**
- See `src/common/mdc/` folder for complete MDC implementation (constants, service, middleware, logger)
- Refer to existing services for usage patterns if MDC is implemented

**Notes:**
- This keeps a per-request context for any logging call inside the request lifecycle.
- If you want MDC in all logs (including outside DI), consider a global provider for `MdcService` and a global logger override via `app.useLogger()`.
- MDC middleware should be registered in `main.ts` after app creation, before other middleware. The MDC service and middleware files should exist in `src/common/mdc/`.

**Alternative Option B: Using `@nestjs/cls`**

If you prefer a maintained abstraction over `cls-hooked`, you can use `@nestjs/cls` (requires Nest v9+). The idea is the same: establish a per-request store and read values when logging.

High-level steps:
- Install: `npm i @nestjs/cls`
- Register: `ClsModule.forRoot({ global: true, middleware: { mount: true } })`
- Set values in a middleware/interceptor, and inject `ClsService` to retrieve `requestId`, `userId` when logging.

This repo already has `cls-hooked`, so Option A is ready-to-use without new dependencies.

---

## Development Setup

### Running the App

1. Create a new file `.env` from `.env.example`
2. Open a new terminal and run: `docker-compose up`
3. Open a new terminal and run: `docker exec -it nestjs_app_1 /bin/bash`
4. Inside the container:
   - `npm install`
   - `npm run start` (production) or `npm run start:dev` (development)
5. Navigate to `http://localhost:5050`

### Building the App

```bash
npm run build
```

### Creating New Modules

```bash
npx @nestjs/cli g module app-<name>
```

Or use local CLI:
```bash
./node_modules/@nestjs/cli/bin/nest.js g module app-<name>
```

### Creating New Resources

```bash
cd app-<name>
npx @nestjs/cli resource resourceName --no-spec
```

**Or use local CLI:**
```bash
./node_modules/@nestjs/cli/bin/nest.js resource resourceName --no-spec
```

**Note:** After creation:
- Controller file is in plural → should be changed after creation
- Service file is in singular
- Entity file is in singular
- Entity files are typically moved to `entities/` folder to be used across the app

### App Bootstrap Configuration

`src/main.ts`:
- Serves static assets from `public/` (also used for uploads)
- Enables CORS
- Applies `localAuthMiddleware` (sets `req.query.__token`/`__pass`)
- Configures Swagger behind Basic Auth when `SWAGGER_USER`/`SWAGGER_PASSWORD` are set

### Database Configuration

- Data source config is in `src/ormconfig.ts` and pulls values from environment variables
- Root module registers TypeORM: `TypeOrmModule.forRoot(ormconfiguration)` in `src/app.module.ts`

### Testing

**Unit Tests:**
- Co-locate test files with source files as `*.spec.ts`
- Example: `project.service.ts` → `project.service.spec.ts`
- Follow NestJS testing patterns with `@nestjs/testing`

**E2E Tests:**
- Place E2E tests in `test/` directory
- Test complete request/response cycles
- Use test database for E2E tests

**Test Structure Example:**
- See `test/app.e2e-spec.ts` for E2E test structure
- Follow NestJS testing documentation for unit test patterns with `@nestjs/testing`

---

## Environment Variables Reference

### App Configuration
- `PORT`: Application port
- `EXPOSED_PORT`: Exposed port for Docker
- `HOST`: Application host

### Swagger
- `SWAGGER_USER`: Username for Swagger Basic Auth (optional)
- `SWAGGER_PASSWORD`: Password for Swagger Basic Auth (optional)

### Database/TypeORM
- `TYPEORM_CONNECTION`: Database connection type (e.g., `postgres`, `mysql`)
- `TYPEORM_HOST`: Database host
- `TYPEORM_PORT`: Database port
- `TYPEORM_USERNAME`: Database username
- `TYPEORM_PASSWORD`: Database password
- `TYPEORM_DATABASE`: Database name
- `TYPEORM_ENTITIES`: Path to entity files (e.g., `dist/entities/*.js`)
- `TYPEORM_MIGRATIONS`: Path to migration files (e.g., `dist/migrations/*.js`)
- `TYPEORM_MIGRATIONS_RUN`: Auto-run migrations on app start (optional)

### JWT
- `JWT_SECRET`: JWT secret key (strategy)
- `JWT_ACCESS_TOKEN_SECRET`: Access token secret
- `JWT_ACCESS_TOKEN_EXPIRATION`: Access token expiration time
- `JWT_REFRESH_TOKEN_EXPIRATION`: Refresh token expiration time

### Mailer
- `MAILER_HOST`: SMTP host
- `MAILER_PORT`: SMTP port
- `MAILER_TLS`: Enable TLS (true/false)
- `MAILER_USER`: SMTP username
- `MAILER_PASS`: SMTP password
- `MAILER_SENDER`: Sender email address

### Frontend
- `FRONT_BASE_URL`: Frontend URL for email links

### External API Integration
- `AI_GATEWAY_BASE_URL` (or `EXTERNAL_AI_BASE_URL`): URL of external gateway (fallbacks to `LITELLM_BASE_URL`)
- `AI_GATEWAY_API_KEY` (or `EXTERNAL_AI_API_KEY`): API key for gateway (fallbacks to `LITELLM_API_KEY`)
- `LITELLM_BASE_URL`: LiteLLM proxy server URL
- `LITELLM_API_KEY`: LiteLLM API key
- `EXTERNAL_USER_PROVIDER`: Provider type (currently 'litellm' supported)
- `DEFAULT_USER_BUDGET`: Default budget assigned to new users (in USD)
- `FAIL_ON_EXTERNAL_USER_ERROR`: Whether to fail user registration if external system is unavailable (true/false)

---

## Important Guidelines Summary

### General
- Check existing similar modules/resources before creating new ones
- For API endpoints, always extend `BaseController` from `app-api/base.controller.ts`
- All entities should extend `BasicEntity` unless there's a specific reason not to
- Entity files are typically placed in `entities/` folder (not in app-* folders)
- Use `class-validator` decorators on all DTOs
- Add `@ApiProperty()` to DTOs and use Swagger decorators in controllers
- Use `BaseController.success()`, `error()`, and `notFound()` methods for responses
- Follow existing TypeORM repository and query builder patterns
- Respect module boundaries - avoid tight coupling between app modules
- Avoid circular dependencies: Design module boundaries carefully, only export what's needed
- Before adding new features, review similar implementations to understand patterns
- Before creating new utilities, check if something similar exists in `common/`
- Use local `@nestjs/cli` instead of npx: `./node_modules/@nestjs/cli/bin/nest.js`

### API Development
- Return `[rows, total]` tuple format for all list endpoints - BaseController automatically sets `meta.total`
- If mapping is needed, map items first then return tuple: `return [mappedItems, total]`
- Always combine `ParseIntPipe` with your find-or-fail pipe to have type-safe entity parameters
- Use `@ApiExtraModels` whenever your DTO types are wrapped by the custom `ApiPaginate*` decorators
- Add `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()` to protected routes
- Follow the property injection pattern (`@Inject`, `@InjectRepository`) used across services and controllers
- Always return `entity.baseGroup` for list endpoints or `entity.toResponse` for single object endpoints
- Keep uploads in `public/uploads` and serve static assets via `main.ts`
- Use `ValidationPipe` with `{ transform: true, whitelist: true }` on all POST/PUT endpoints
- Use `class-validator` decorators on all DTO properties
- Use appropriate HTTP exceptions (`NotFoundException`, `ConflictException`, `BadRequestException`, etc.)
- Use `Logger` in services for consistent logging

### Entities
- Always extend `BasicEntity` unless there's a specific reason not to
- Entity files are typically placed in `entities/` folder (not in app-* folders) to be used across the app
- Use snake_case for database column names, camelCase for TypeScript property names
- Always specify `type` explicitly in `@Column()`
- Mark nullable columns with `nullable: true`
- Always specify `@JoinColumn({ name: 'foreign_key_name' })` for relationships
- Implement `baseGroup` getter for list views
- Implement `toResponse` getter for single object endpoints
- Never include passwords or tokens in response getters
- Define enums separately, use string columns with enum values
- Add indexes for frequently queried columns using `@Index()` decorator
- Use `softDelete()` instead of `remove()` for soft deletes
- Use `withDeleted: true` option when querying to include soft-deleted records
- Use `leftJoinAndSelect` or `innerJoinAndSelect` in QueryBuilder to load relations

### Migrations
- Always implement `down()` - make migrations reversible
- Test migrations: test `up()`, test `down()`, test on copy of production data
- Use descriptive names: `AddExternalUserFields`, `CreateApiKeys`, etc.
- One change per migration - keep migrations focused and atomic
- Handle existing data when adding/modifying columns
- Never modify migrations that have run in production - create a new migration instead
- TypeORM handles transactions automatically, but be aware of transaction boundaries
- Create indexes in separate migrations for clarity
- Use `queryRunner.query()` for raw SQL when needed
- Use `queryRunner.createForeignKey()` and `queryRunner.dropForeignKey()` for foreign key operations
- For foreign key relationships: Create foreign key constraints after creating both tables

### External Integrations
- Use `HttpService` from `@nestjs/axios` for external API calls
- Use `ConfigService` to access environment variables
- Handle external API failures gracefully (check `FAIL_ON_EXTERNAL_USER_ERROR` env var)
- Use `firstValueFrom` from `rxjs` to convert observables to promises
- Log external API calls and errors using `Logger`

### Email & Templates
- Email templates are in `templates/email/` directory (Handlebars format)
- Use `MailerService` from `@nestjs-modules/mailer` to send emails
- Template context variables are passed via `context` object
- MailerModule is configured globally in `app.module.ts`

### Testing
- Unit tests: Co-locate with source files as `*.spec.ts` (e.g., `project.service.spec.ts`)
- E2E tests: Place in `test/` directory
- Test structure: Follow NestJS testing patterns with `@nestjs/testing`
- Use test database for E2E tests

### Code Formatting
- Configure VS Code to format with Prettier (recommended to autoformat on save)
- This ensures consistent code style across the project

### Module Import/Export Patterns
- Avoid circular dependencies: Design module boundaries carefully
- Use exports properly: Only export what other modules need from `CommonModule`
- Import in app modules: Each `app-*.module.ts` imports its feature modules
- Root module: `app.module.ts` imports all `App*Module` classes
- If circular dependency occurs, refactor shared code to `common/` or create intermediate module

---

## Example References in the Codebase

- **Clients**: `src/app-api/client/*` (CRUD + pagination + find-or-fail pipe + Swagger decorators)
- **Users & Roles**: `src/app-auth/user/*`, `src/app-auth/role/*` (entity-safe response getters, role checks, pagination)
- **Documents**: `src/app-documents/document/*` (file uploads, pagination, response wrappers)
- **Auth**: `src/app-auth/auth/*`, `src/app-auth/guards/*`, `src/app-auth/strategies/*`

Use these as live templates when creating new features.

---

## Key Files Reference (Anatomy of Existing Files)

### Core Infrastructure Files

- **`src/app-api/base.controller.ts`**: Standardizes JSON responses via `success()`, `error()`, `notFound()` with the `{ status, data, meta }` shape. Automatically extracts `meta.total` when `data` is `[rows, count]`.
- **`src/app-api/base.resource.ts`**: Base resource class (generic response wrapper) - defines `{ data: Model[], meta: { total: number } }` structure.
- **`src/common/pagination.service.ts`**: Centralized pagination logic for repositories and query builders. Reads `page`, `pageSize`, `sortBy`, `sortOrder` from `req.query`.
- **`src/common/dto/pagination.dto.ts`**: Swagger helpers `ResponsePaginationDto`, `ResponsePaginationObjDto`, and decorators `ApiPaginateDto`/`ApiPaginateObjDto` to document the response envelope consistently.

### Resource Module Layout

- **`src/app-api/<feature>/*.ts`**: Typical resource module layout:
  - `<features>.controller.ts`: Routes, Swagger docs, extends `BaseController`, uses find-or-fail pipes
  - `<feature>.service.ts`: Business logic, repositories, pagination
  - `dto/*.ts`: Request/response DTOs documented with `@ApiProperty`
  - `pipe/find-<feature>-or-fail-pipe.service.ts`: Resolves IDs to entities; throws `NotFoundException`
  - `<feature>.module.ts`: Wires `TypeOrmModule.forFeature`, service, pipe, and shared providers

### Entity and Data Files

- **`src/entities/*.ts`**: TypeORM entities that extend `BasicEntity`. Entities are typically placed here (not in app-* folders). Many implement `baseGroup` or `toResponse` getters to shape safe client responses.

### Authentication Module

- **`src/app-auth/*`**: Authentication module with auth endpoints (`auth.controller.ts`), JWT issuance / refresh token storage (`auth.service.ts`), and Passport strategies/guards.

### File Uploads

- **`src/app-documents/document/*`**: Demonstrates file upload via `FileInterceptor`, `diskStorage`, and Swagger docs for multipart.

### Application Bootstrap

- **`src/main.ts`**: Bootstraps the app (static assets, CORS, Swagger with optional Basic Auth, MDC middleware, local middleware).
- **`src/ormconfig.ts`**: DB configuration via environment variables; used by `TypeOrmModule.forRoot` in `app.module.ts`.

### MDC Implementation

- **`src/common/mdc/*`**: MDC (Mapped Diagnostic Context) implementation for request correlation (requestId, userId, email).

---

---

## Important Decision Points & Clarifications

### When to Use baseGroup vs toResponse

- **`baseGroup`**: Use for lightweight list views, nested objects in lists, or when you need minimal data
- **`toResponse`**: Use for single object endpoints, detailed views, or when you need full entity data including relations
- **Direct entity**: Some controllers return entities directly if the entity has proper serialization (less common, prefer getters)

### Service Return Format

**Tuple format `[items, total]` (Recommended for all list endpoints):**
- BaseController automatically detects and sets `meta.total`
- Simpler controller code
- Use when you can return results directly from repository

**When mapping is needed:**
- Map items first, then return tuple: `return [mappedItems, total]`
- This keeps the response format consistent with BaseController expectations
- Example: `const items = results[0].map((item) => item.baseGroup); return [items, total]`

### ValidationPipe: Where to Apply

- **Method-level**: Most common, allows different options per endpoint
- **Parameter-level**: Quick validation on specific parameters
- **Controller-level**: Apply same validation to all endpoints in controller
- **Global**: Configure in `main.ts` for app-wide validation (not currently used)

### Error Handling Strategy

- **Services**: Throw HTTP exceptions (`NotFoundException`, `ConflictException`, etc.)
- **Controllers**: Wrap service calls in try-catch, use `this.error(res, message)` from BaseController
- **Pipes**: Throw exceptions directly (e.g., `NotFoundException` in find-or-fail pipes)
- **Guards**: Throw `UnauthorizedException` or `ForbiddenException`

### External API Integration Pattern

When integrating with external systems:
1. Create service in `common/services/` if used by multiple modules
2. Use `HttpService` from `@nestjs/axios` with `firstValueFrom`
3. Use `ConfigService` for environment variables
4. Handle failures gracefully (check `FAIL_ON_EXTERNAL_USER_ERROR` env var)
5. Log all external calls and errors using `Logger`
6. Implement transaction rollback if external call fails (see `user.service.ts` example):
   - Save entity first
   - Call external API
   - If external call fails and `FAIL_ON_EXTERNAL_USER_ERROR=true`, delete saved entity and throw error
   - If external call fails and `FAIL_ON_EXTERNAL_USER_ERROR=false`, log warning and continue

### QueryBuilder vs Repository Methods

**Use QueryBuilder when:**
- You need complex joins (`leftJoinAndSelect`, `innerJoinAndSelect`)
- You need custom WHERE conditions with parameters
- You need to build dynamic queries
- You need to map results before returning

**Use Repository methods when:**
- Simple find operations (`findOne`, `find`, `findAndCount`)
- Standard CRUD operations
- You don't need relations loaded

### Soft Delete vs Hard Delete

- **Soft delete** (recommended): Use `softDelete()` - preserves data, can be restored
- **Hard delete**: Use `remove()` or `delete()` - permanently removes data
- Always use soft delete unless there's a specific requirement for hard delete
- Query with `withDeleted: true` to include soft-deleted records when needed

---

This guide consolidates all patterns, conventions, and instructions needed to work effectively on this NestJS boilerplate project. When in doubt, refer to existing implementations in the codebase as examples.

