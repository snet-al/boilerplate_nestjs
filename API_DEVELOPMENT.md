## API development guide: how APIs are built in this project

This guide explains, in one place, how an API is created in this NestJS project, how each related file works, and the unique patterns used across the codebase.

The examples reference existing modules such as `clients`, `users`, and `documents` so you can see real code patterns. You can search for the mentioned files under `src/...` to view full implementations.

## TL;DR checklist (new resource)

- **Entity**: Create `src/entities/<feature>.entity.ts` extending `BasicEntity`; add `baseGroup` or `toResponse` getters.
- **DTOs**: Create `Create<Feature>Dto`, `Update<Feature>Dto`, `Response<Feature>Dto` with `@ApiProperty`.
- **Service**: Create `<feature>.service.ts` with TypeORM repository access and pagination via `PaginationService`.
- **Find-or-fail pipe**: Create `pipe/find-<feature>-or-fail-pipe.service.ts` to resolve `:id` params to entities.
- **Controller**: Create `<features>.controller.ts` extending `BaseController`; wire routes and Swagger decorators; use the pipe in `@Param`.
- **Module**: Create `<feature>.module.ts` registering `TypeOrmModule.forFeature`, service, pipe, and `PaginationService`.
- **Register module**: Import your module in the appropriate app module (e.g., `AppApiModule`).
- **Auth (optional)**: Protect endpoints via `@UseGuards(JwtAuthGuard)` and add `@ApiBearerAuth()`.

---

## Project-wide unique patterns

### 1) Standard response wrapper via BaseController

- Controllers extend `BaseController` (`src/app-api/base.controller.ts`) and call:
  - `success(res, data)` → returns `{ status: 'success', data, meta: { total } }`
  - `error(res, message?)` → returns `{ status: '<message>', data: '', meta: { total: 0 } }` with 400
  - `notFound(res, message?)` → returns 404
- For list endpoints, returning `[rows, total]` (e.g., TypeORM `findAndCount()` or QueryBuilder `getManyAndCount()`) allows `BaseController` to automatically set `data = rows` and `meta.total = total`.

Why: This guarantees a consistent response envelope across all endpoints and makes Swagger documentation predictable.

### 2) Pagination service for lists

- `src/common/pagination.service.ts` centralizes pagination logic.
- Two usage modes:
  - `paginateQueryBuilder(qb, req)` for QueryBuilder-based queries (adds `take`, `skip`, and optional `order`).
  - `paginate({}, req)` to build `take/skip/order` options for repository `.findAndCount()`.
- Request query params:
  - `page` (default 1), `pageSize` (default 20), `sortBy`, `sortOrder` (default `ASC`).

Why: This keeps pagination consistent and keeps controllers/services focused on business logic.

### 3) Find-or-fail pipes for param binding

- For each entity, create a `Find<Entity>OrFailPipeService` pipe under the feature folder (e.g., `src/app-api/client/pipe/find-client-or-fail-pipe.service.ts`).
- Use it in controllers like: `@Param('id', ParseIntPipe, FindClientOrFailPipeService) client: Client`.

Why: Transforms `:id` params directly into loaded entities and throws `NotFoundException` if missing, simplifying controllers.

### 4) Response models and Swagger wrappers

- Response DTOs (e.g., `ResponseClientDto`) describe the shape of the item returned in `data`.
- Custom Swagger helpers:
  - `ApiPaginateDto({ type: ResponseXDto })` for list endpoints: documents `{ status, meta.total, data: type[] }`.
  - `ApiPaginateObjDto({ type: ResponseXDto })` for single-item endpoints: documents `{ status, meta.total, data: type }`.
- Add `@ApiExtraModels(ResponsePaginationDto, ResponsePaginationObjDto, CreateXDto, UpdateXDto)` on controllers to ensure schemas appear.

Why: Ensures Swagger/OpenAPI matches the app’s consistent response envelope.

### 5) Entities with safe response getters

- Entities extend `BasicEntity` to inherit `id`, `createdAt`, `updatedAt`, `deletedAt`.
- Implement getters for safe serialization:
  - `baseGroup` for a lightweight subset
  - `toResponse` for a full, client-safe view (including relations)
- Controllers often return `entity.baseGroup` or `entity.toResponse` through `BaseController.success()`.

Why: Prevents leaking internal fields and centralizes response shape per entity.

### 6) Property injection style

- Services and controllers commonly use `@Inject()`/`@InjectRepository()` property injection instead of constructor injection.

Why: A project style choice that keeps constructors minimal and mirrors Angular-like patterns.

### 7) Authentication and guards

- Strategies: `JwtStrategy` and `LocalStrategy` in `src/app-auth/strategies`.
- Guards: `JwtAuthGuard` and `LocalAuthGuard` in `src/app-auth/guards`.
- Typical usage per route:
  - Add `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()` for protected routes.
- Auth endpoints are in `src/app-auth/auth/auth.controller.ts` and implemented in `auth.service.ts` (login, logout, password reset, activation).

Why: Standard Nest Passport flow with JWT; guards are opt-in per route or controller.

### 8) File uploads pattern

- See `src/app-documents/document/documents.controller.ts` for `FileInterceptor` usage with custom `diskStorage` to `public/uploads` and `uuid` file names.
- Swagger annotates uploads using `@ApiConsumes('multipart/form-data')` and `@ApiBody` schema.

Why: Provides a ready-made pattern for multipart uploads with documented schema.

### 9) App bootstrap, static assets, and Swagger security

- `src/main.ts`:
  - Serves static assets from `public/` (also used for uploads)
  - Enables CORS
  - Applies `localAuthMiddleware` (sets `req.query.__token`/`__pass`)
  - Configures Swagger behind Basic Auth when `SWAGGER_USER`/`SWAGGER_PASSWORD` are set

Why: Makes docs protected in non-dev environments and serves the embedded `public/index.html`.

### 10) Database and configuration

- Data source config is in `src/ormconfig.ts` and pulls values from environment variables (e.g., `TYPEORM_CONNECTION`, `TYPEORM_HOST`, `TYPEORM_ENTITIES`, `TYPEORM_MIGRATIONS`).
- Root module registers TypeORM: `TypeOrmModule.forRoot(ormconfiguration)` in `src/app.module.ts`.

Why: Environment-driven config supports multiple DB engines and flexible build setups.

---

## How to create a new API (step-by-step)

Below is a concrete example to add a new resource called “Project”. Replace names accordingly.

### 1) Create the entity

File: `src/entities/project.entity.ts`

```ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'
import { BasicEntity } from './basic.entity'

@Entity('projects')
export class Project extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'name', type: 'varchar' })
  name: string

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string

  public get baseGroup() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
    }
  }
}
```

Notes:
- Extend `BasicEntity` to inherit timestamps and soft delete columns.
- Implement at least a `baseGroup` getter.

### 2) Create DTOs

Files: `src/app-api/project/dto/create-project.dto.ts`, `update-project.dto.ts`, `response-project.dto.ts`

```ts
import { ApiProperty } from '@nestjs/swagger'

export class CreateProjectDto {
  @ApiProperty()
  name: string

  @ApiProperty({ required: false })
  description?: string
}

export class UpdateProjectDto {
  @ApiProperty({ required: false })
  name?: string

  @ApiProperty({ required: false })
  description?: string
}

export class ResponseProjectDto {
  @ApiProperty() id: number
  @ApiProperty() name: string
  @ApiProperty({ required: false }) description?: string
}
```

Notes:
- Use `@ApiProperty` so Swagger can generate schemas.

### 3) Create the service

File: `src/app-api/project/project.service.ts`

```ts
import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from '../../entities/project.entity'
import { PaginationService } from '../../common/pagination.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'

@Injectable()
export class ProjectService {
  @Inject(PaginationService)
  private pagination: PaginationService

  @InjectRepository(Project)
  private repo: Repository<Project>

  async findAll(req: any) {
    // Option A: QueryBuilder
    const qb = this.repo.createQueryBuilder('project')
    await this.pagination.paginateQueryBuilder(qb, req)
    return qb.getManyAndCount() // [entities, total]
  }

  async create(dto: CreateProjectDto) {
    const entity = this.repo.create(dto)
    return this.repo.save(entity)
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } })
  }

  async update(project: Project, dto: UpdateProjectDto) {
    const merged = this.repo.merge(project, dto)
    return this.repo.save(merged)
  }

  async remove(project: Project) {
    return this.repo.softRemove(project)
  }
}
```

Notes:
- Return `[rows, total]` for list endpoints to let `BaseController` set `meta.total`.
- Use `PaginationService` for consistent paging/sorting.

### 4) Create the find-or-fail pipe

File: `src/app-api/project/pipe/find-project-or-fail-pipe.service.ts`

```ts
import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from '../../../entities/project.entity'

@Injectable()
export class FindProjectOrFailPipeService implements PipeTransform<number, Promise<Project>> {
  @InjectRepository(Project)
  private repo: Repository<Project>

  async transform(id: number): Promise<Project> {
    const project = await this.repo.findOne({ where: { id } })
    if (!project) throw new NotFoundException(`Project ${id} not found`)
    return project
  }
}
```

### 5) Create the controller

File: `src/app-api/project/projects.controller.ts`

```ts
import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Res, Req, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { BaseController } from '../base.controller'
import { ProjectService } from './project.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ResponseProjectDto } from './dto/response-project.dto'
import { FindProjectOrFailPipeService } from './pipe/find-project-or-fail-pipe.service'
import { ApiPaginateDto, ApiPaginateObjDto, ResponsePaginationDto, ResponsePaginationObjDto } from '../../common/dto/pagination.dto'
import { Project } from '../../entities/project.entity'
import { JwtAuthGuard } from '../../app-auth/guards/jwt-auth.guard'

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@ApiExtraModels(ResponsePaginationDto, ResponsePaginationObjDto, CreateProjectDto, UpdateProjectDto)
export class ProjectsController extends BaseController {
  @Inject(ProjectService)
  private service: ProjectService

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List projects' })
  @ApiPaginateDto({ status: 200, description: 'All projects', type: ResponseProjectDto })
  async findAll(@Req() req, @Res() res: Response) {
    try {
      const data = await this.service.findAll(req)
      return this.success(res, data)
    } catch (e) {
      return this.error(res, e.message)
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create project' })
  @ApiPaginateObjDto({ status: 200, description: 'Created', type: ResponseProjectDto })
  async create(@Body() dto: CreateProjectDto, @Res() res: Response) {
    try {
      const project = await this.service.create(dto)
      return this.success(res, project)
    } catch (e) {
      return this.error(res, e.message)
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get one project' })
  @ApiPaginateObjDto({ status: 200, description: 'Single project', type: ResponseProjectDto })
  async findOne(@Param('id', ParseIntPipe, FindProjectOrFailPipeService) project: Project, @Res() res: Response) {
    try {
      return this.success(res, project.baseGroup)
    } catch (e) {
      return this.error(res, e.message)
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update project' })
  @ApiPaginateObjDto({ status: 200, description: 'Updated', type: ResponseProjectDto })
  async update(
    @Param('id', ParseIntPipe, FindProjectOrFailPipeService) project: Project,
    @Body() dto: UpdateProjectDto,
    @Res() res: Response,
  ) {
    try {
      const updated = await this.service.update(project, dto)
      return this.success(res, updated)
    } catch (e) {
      return this.error(res, e.message)
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete project' })
  @ApiPaginateObjDto({ status: 200, description: 'Deleted', type: ResponseProjectDto })
  async remove(@Param('id', ParseIntPipe, FindProjectOrFailPipeService) project: Project, @Res() res: Response) {
    try {
      await this.service.remove(project)
      return this.success(res, {})
    } catch (e) {
      return this.error(res, e.message)
    }
  }
}
```

Notes:
- Controllers extend `BaseController` and use `try/catch` to report short error messages via `error()`.
- For object endpoints, return `entity.baseGroup` or `entity.toResponse` as needed.

### 6) Create the module

File: `src/app-api/project/project.module.ts`

```ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Project } from '../../entities/project.entity'
import { ProjectService } from './project.service'
import { ProjectsController } from './projects.controller'
import { PaginationService } from '../../common/pagination.service'
import { FindProjectOrFailPipeService } from './pipe/find-project-or-fail-pipe.service'

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectsController],
  providers: [ProjectService, PaginationService, FindProjectOrFailPipeService],
})
export class ProjectModule {}
```

### 7) Register in the app

- Import your new module in an app-level module, e.g., `src/app-api/app-api.module.ts`:

```ts
import { Module } from '@nestjs/common'
import { ClientModule } from './client/client.module'
import { ProjectModule } from './project/project.module'

@Module({
  imports: [ClientModule, ProjectModule],
})
export class AppApiModule {}
```

### 8) Swagger docs and security

- In controllers, use:
  - `@ApiTags('<FeatureName>')`
  - `@ApiBearerAuth()` to display the lock icon
  - `@ApiOperation`, `@ApiResponse` for human-readable docs
  - `ApiPaginateDto` / `ApiPaginateObjDto` to describe the envelope
- Swagger is available at `/docs` and can be optionally protected via Basic Auth if `SWAGGER_USER` and `SWAGGER_PASSWORD` are set.

---

## Anatomy of existing files (what each does)

- `src/app-api/base.controller.ts`: Standardizes JSON responses via `success()`, `error()`, `notFound()` with the `{ status, data, meta }` shape. Automatically extracts `meta.total` when `data` is `[rows, count]`.

- `src/common/pagination.service.ts`: Centralized pagination logic for repositories and query builders. Reads `page`, `pageSize`, `sortBy`, `sortOrder` from `req.query`.

- `src/common/dto/pagination.dto.ts`: Swagger helpers `ResponsePaginationDto`, `ResponsePaginationObjDto`, and decorators `ApiPaginateDto`/`ApiPaginateObjDto` to document the response envelope consistently.

- `src/app-api/<feature>/*.ts`: Typical resource module layout:
  - `<features>.controller.ts`: Routes, Swagger docs, extends `BaseController`, uses find-or-fail pipes.
  - `<feature>.service.ts`: Business logic, repositories, pagination.
  - `dto/*.ts`: Request/response DTOs documented with `@ApiProperty`.
  - `pipe/find-<feature>-or-fail-pipe.service.ts`: Resolves IDs to entities; throws `NotFoundException`.
  - `<feature>.module.ts`: Wires `TypeOrmModule.forFeature`, service, pipe, and shared providers.

- `src/entities/*.ts`: TypeORM entities that extend `BasicEntity`. Many implement `baseGroup` or `toResponse` getters to shape safe client responses.

- `src/app-auth/*`: Authentication module with auth endpoints (`auth.controller.ts`), JWT issuance / refresh token storage (`auth.service.ts`), and Passport strategies/guards.

- `src/app-documents/document/*`: Demonstrates file upload via `FileInterceptor`, `diskStorage`, and Swagger docs for multipart.

- `src/main.ts`: Bootstraps the app (static assets, CORS, Swagger with optional Basic Auth, local middleware).

- `src/ormconfig.ts`: DB configuration via environment variables; used by `TypeOrmModule.forRoot` in `app.module.ts`.

---

## Conventions and tips

- **Return shape**: For lists, return `[entities, total]` so `BaseController` can set `meta.total`. For single-object operations, return the entity (or its safe getter) directly.
- **Param binding**: Always combine `ParseIntPipe` with your find-or-fail pipe to have type-safe entity parameters.
- **Swagger**: Use `@ApiExtraModels` whenever your DTO types are wrapped by the custom `ApiPaginate*` decorators.
- **Security**: Add `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()` to protected routes.
- **Property injection**: Follow the property injection pattern (`@Inject`, `@InjectRepository`) used across services and controllers for consistency.
- **Serialization**: Prefer returning `entity.baseGroup` or `entity.toResponse` to avoid leaking internal fields.
- **Uploads**: Keep uploads in `public/uploads` and serve static assets via `main.ts`.

---

## Environment variables reference (commonly used)

- **App**: `PORT`, `EXPOSED_PORT`, `HOST`
- **Swagger**: `SWAGGER_USER`, `SWAGGER_PASSWORD`
- **DB/TypeORM**: `TYPEORM_CONNECTION`, `TYPEORM_HOST`, `TYPEORM_PORT`, `TYPEORM_USERNAME`, `TYPEORM_PASSWORD`, `TYPEORM_DATABASE`, `TYPEORM_ENTITIES`, `TYPEORM_MIGRATIONS`
- **JWT**: `JWT_SECRET` (strategy), `JWT_ACCESS_TOKEN_SECRET`, `JWT_ACCESS_TOKEN_EXPIRATION`, `JWT_REFRESH_TOKEN_EXPIRATION`
- **Mailer**: `MAILER_HOST`, `MAILER_PORT`, `MAILER_TLS`, `MAILER_USER`, `MAILER_PASS`, `MAILER_SENDER`

---

## Example references in the codebase

- Clients: `src/app-api/client/*` (CRUD + pagination + find-or-fail pipe + Swagger decorators)
- Users & Roles: `src/app-auth/user/*`, `src/app-auth/role/*` (entity-safe response getters, role checks, pagination)
- Documents: `src/app-documents/document/*` (file uploads, pagination, response wrappers)
- Auth: `src/app-auth/auth/*`, `src/app-auth/guards/*`, `src/app-auth/strategies/*`

Use these as live templates when creating new features.

---

## MDC (Mapped Diagnostic Context) / request correlation

This project already includes `cls-hooked` in `package.json`, which we can use to implement MDC-style request context for consistent correlation IDs and user context in logs. Below are two approaches; pick one.

### Option A: DIY MDC using `cls-hooked` (recommended here)

1) Create a small MDC utility

File: `src/common/mdc/mdc.constants.ts`

```ts
export const CLS_NAMESPACE = 'app:mdc'
export const MDC_KEYS = {
  requestId: 'requestId',
  userId: 'userId',
  email: 'email',
}
```

File: `src/common/mdc/mdc.service.ts`

```ts
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
```

2) Initialize context per request

File: `src/common/mdc/mdc.middleware.ts`

```ts
import { v4 as uuidv4 } from 'uuid'
import { Request, Response, NextFunction } from 'express'
import { getNamespace, createNamespace } from 'cls-hooked'
import { CLS_NAMESPACE, MDC_KEYS } from './mdc.constants'

export function mdcMiddleware(req: Request, _res: Response, next: NextFunction) {
  const ns = getNamespace(CLS_NAMESPACE) || createNamespace(CLS_NAMESPACE)
  ns.run(() => {
    ns.set(MDC_KEYS.requestId, uuidv4())
    if ((req as any).user) {
      ns.set(MDC_KEYS.userId, (req as any).user.userId || (req as any).user.id)
      ns.set(MDC_KEYS.email, (req as any).user.email)
    }
    next()
  })
}
```

3) Optional: MDC-aware logger

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

4) Wire it up in `main.ts`

```ts
// src/main.ts
import { mdcMiddleware } from './common/mdc/mdc.middleware'
// ... create app
app.use(mdcMiddleware)
```

5) Use in services/controllers

```ts
import { Inject } from '@nestjs/common'
import { MdcService } from '../common/mdc/mdc.service'
import { MdcLogger } from '../common/mdc/mdc.logger'

export class ExampleService {
  @Inject(MdcService)
  private mdc: MdcService

  private readonly logger = new MdcLogger(this.mdc, ExampleService.name)

  doWork() {
    this.logger.log('processing started')
  }
}
```

Notes:
- This keeps a per-request context for any logging call inside the request lifecycle.
- If you want MDC in all logs (including outside DI), consider a global provider for `MdcService` and a global logger override via `app.useLogger()`.

### Option B: Using `@nestjs/cls` (alternative)

If you prefer a maintained abstraction over `cls-hooked`, you can use `@nestjs/cls` (requires Nest v9+). The idea is the same: establish a per-request store and read values when logging.

High-level steps:
- Install: `npm i @nestjs/cls`
- Register: `ClsModule.forRoot({ global: true, middleware: { mount: true } })`
- Set values in a middleware/interceptor, and inject `ClsService` to retrieve `requestId`, `userId` when logging.

This repo already has `cls-hooked`, so Option A is ready-to-use without new dependencies.


