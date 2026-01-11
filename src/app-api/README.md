# App API Module (`app-api/`)

## Overview

The `app-api` module provides base controller classes and establishes standard patterns for REST API endpoints. It also contains API-related resources like client and key management.

## Structure

```
app-api/
├── app-api.module.ts       # Main module
├── base.controller.ts      # Base controller with standardized response methods
├── base.resource.ts        # Base resource class
├── client/                 # Client resource
└── keys/                   # API key management
```

## Key Component

### Base Controller

All API controllers must extend `BaseController` to ensure consistent response format across the application. It provides standardized response methods and handles pagination automatically.

## Rules and Guidelines

### Creating New Resources

When adding a new resource to this module:

1. Create folder structure: `dto/`, `pipe/`, controller, service, and module files
2. Create entity in `entities/` folder extending `BasicEntity`
3. Create DTOs: `create-<resource>.dto.ts`, `update-<resource>.dto.ts`, `response-<resource>.dto.ts` in `dto/` folder
4. Create service with TypeORM repository injection
5. Create controller extending `BaseController`
6. Create find-or-fail pipe (see below)
7. Create module file wiring everything together:
   - Register entity in `TypeOrmModule.forFeature([Entity])`
   - Register service, pipe, and `PaginationService` in providers
   - Register controller
8. Import your new module in `app-api.module.ts` (add to imports array in `app-api.module.ts`)
9. For list endpoints, return `[items, total]` tuple from service:
   - Use `queryBuilder.getManyAndCount()` which returns `[entities, totalCount]`
   - Map entities array to response format (e.g., using `baseGroup` or `toResponse` getter)
   - Return `[mappedItems, totalCount]` tuple where `totalCount` is from `results[1]`
   - BaseController automatically detects tuple format and sets `meta.total`

### Creating Find-or-Fail Pipes

Find-or-fail pipes validate and resolve ID parameters to entities:

**File location:** `pipe/find-<resource>-or-fail-pipe.service.ts`

**Structure:**
- Class name: `Find<Resource>OrFailPipeService`
- Must implement `PipeTransform<number, Promise<Resource>>`
- Inject repository: `@InjectRepository(Entity)`
- Implement `transform(id: number)` method:
  - Query entity by ID (can use `findOne()` or `createQueryBuilder()`)
  - Throw `NotFoundException` if entity not found
  - Return entity if found
- Must be registered in module providers array

**Usage in controllers:** `@Param('id', ParseIntPipe, FindResourceOrFailPipeService)`

### Response Format

- Use `this.success(res, data)` for successful responses
- Use `this.error(res, message)` for errors
- Use `this.notFound(res, message)` for not found
- BaseController automatically handles pagination when data is `[rows, total]` tuple

### Swagger Documentation

- Use `@ApiTags()` at controller level
- Use `@ApiBearerAuth()` for authenticated endpoints
- Use `@ApiOperation()` and `@ApiResponse()` at endpoint level
- Use `@ApiProperty()` on all DTO properties

### DTOs

- Create DTOs with `@ApiProperty()` decorators
- Use `class-validator` decorators for validation
- Update DTOs should have all fields optional
- Create separate Response DTOs for API responses

### Authentication

- Protect endpoints with `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()`
- Access current user via `req.user`

### Pagination

- Inject `PaginationService` using `@Inject(PaginationService)` in services
- Use `paginationService.paginateQueryBuilder(queryBuilder, request)` for query builders (most common)
- Use `queryBuilder.getManyAndCount()` to get both items and total count
- Return `[items, total]` tuple from service list methods (items array, total number)
- BaseController automatically detects tuple format and populates `meta.total`
- Query params: `page`, `pageSize`, `sortBy`, `sortOrder`

## Important Guidelines

- Always extend `BaseController` - never create controllers without it
- Always use `this.success()`, `this.error()`, `this.notFound()` - never return raw responses
- Always use find-or-fail pipes for `:id` parameters (with `ParseIntPipe` before it)
- Register find-or-fail pipes in module providers when they use dependency injection
- Wrap service calls in try-catch blocks
- Import `BaseController` from `../base.controller` or `../../app-api/base.controller`
- Follow existing patterns in `client/` and `keys/` folders
