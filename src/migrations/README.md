# Migrations (`migrations/`)

## Overview

The `migrations/` folder contains TypeORM database migration files. Migrations are used to version control and apply incremental changes to your database schema over time.

## Migration Files

Migrations are named with a timestamp prefix followed by a descriptive name:
- Format: `<timestamp>-<DescriptiveName>.ts`
- Example: `1667216838128-init.ts`, `1673456789123-AddExternalUserFields.ts`

## Rules and Guidelines

### Creating New Migrations

**Manual Creation (Preferred):**
1. Create new file in `migrations/` folder with name: `<timestamp>-<DescriptiveName>.ts`
2. Use current timestamp in milliseconds (e.g., `Date.now()` or follow existing timestamp pattern)
3. Use descriptive, PascalCase name (e.g., `AddExternalUserFields`, `CreateApiKeysTable`)
4. Copy the migration structure template (see below)
5. Implement `up()` and `down()` methods

**Migration File Structure:**

Every migration file must follow this structure:

**Migration File Template:**

Every migration file must have this structure:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm"

export class AddExampleFields1234567890123 implements MigrationInterface {
    name = 'AddExampleFields1234567890123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Forward migration: create tables, columns, indexes, add data
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse migration: drop tables, columns, indexes, remove data
        // Must perfectly reverse everything done in up()
    }
}
```

**Key Requirements:**
- Class name format: `<DescriptiveName><Timestamp>` (PascalCase, e.g., `AddExternalUserFields1673456789123`)
- `name` property: Must exactly match class name as string
- Import `MigrationInterface` and `QueryRunner` from `typeorm`
- Both `up()` and `down()` methods are required
- `down()` must perfectly reverse all changes made in `up()`

**Key Requirements:**
- Class name: `<DescriptiveName><Timestamp>` (PascalCase, e.g., `AddExternalUserFields1673456789123`)
- `name` property: Same as class name as string
- `up()`: Applied when running migrations forward - creates tables, columns, indexes, adds data
- `down()`: Applied when reverting migrations - must perfectly reverse everything done in `up()`

### Common Migration Operations

- Create/drop tables
- Add/drop columns
- Create/drop indexes
- Add/drop foreign keys: Use `queryRunner.createForeignKey()` and `queryRunner.dropForeignKey()`
- Modify column types
- Raw SQL queries: Use `queryRunner.query()` for complex operations
- For foreign key relationships: Create foreign key constraints after creating both tables

### Running Migrations

- Run all pending migrations: `npm run migration:run`
- Revert last migration: `npm run migration:revert`
- TypeORM tracks executed migrations in a `migrations` table

### Migration Best Practices

- Always implement `down()` - make migrations reversible
- TypeORM handles transactions automatically
- Test migrations: test `up()`, test `down()`, test on copy of production data
- Use descriptive names: `AddExternalUserFields`, `CreateApiKeys`, etc.
- One change per migration - keep migrations focused and atomic
- Handle existing data when adding/modifying columns
- Never modify migrations that have run in production - create a new migration instead

### Migration Naming

- Use descriptive, action-oriented names
- Examples: `CreateUsersTable`, `AddEmailToUsers`, `AddIndexToUsersEmail`

### Ordering Migrations

- Migrations are executed in timestamp order (by filename)
- The timestamp prefix determines execution order

## Environment Configuration

Migrations use configuration from `ormconfig.ts` which reads from environment variables:
- `TYPEORM_CONNECTION`, `TYPEORM_HOST`, `TYPEORM_PORT`, `TYPEORM_USERNAME`, `TYPEORM_PASSWORD`, `TYPEORM_DATABASE`
- `TYPEORM_MIGRATIONS`: Path to migrations (e.g., `dist/migrations/*.js`)
- `TYPEORM_MIGRATIONS_RUN`: Auto-run migrations on app start (optional)

## Important Guidelines

- Create migration files manually in `migrations/` folder
- Use timestamp in milliseconds for filename prefix (ensure it's after the latest migration timestamp)
- Use descriptive PascalCase names that clearly describe what the migration does
- Always provide complete rollback logic in `down()` method - it must perfectly reverse `up()`
- Test that `down()` correctly reverses `up()` before deploying
- Keep migrations focused and atomic - one change per migration
- Consider existing data when adding/modifying columns
- Never modify migrations that have run in production - create a new migration instead
- Ensure migrations don't break dependent data
- TypeORM handles transactions automatically, but be aware of transaction boundaries
- Create indexes in separate migrations for clarity
- Provide defaults when adding NOT NULL columns to existing tables
- Use `queryRunner.query()` for raw SQL when needed
- For foreign key relationships: Create foreign key constraints after creating both tables
