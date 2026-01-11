# Entities (`entities/`)

## Overview

The `entities/` folder contains all TypeORM entity definitions that represent database tables. Entities define the structure, relationships, and constraints for your database schema.

## Basic Entity

All entities should extend `BasicEntity` which provides common fields:
- `id`: Primary key
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp
- `deletedAt`: Soft delete timestamp

## Rules and Guidelines

### Creating New Entities

- Always extend `BasicEntity` unless there's a specific reason not to
- Use proper TypeORM decorators: `@Entity()`, `@Column()`, etc.
- Use snake_case for database column names
- Use camelCase for TypeScript property names
- Always specify `type` explicitly in `@Column()`
- Mark nullable columns with `nullable: true`

### Column Types

Common TypeORM column types: `varchar`, `text`, `integer`, `decimal`, `float`, `boolean`, `date`, `datetime`, `timestamp`, `json`, `enum`

### Relationships

**Many-to-One Pattern:**
- Include both: foreign key column (e.g., `userId: number`) AND relationship property (e.g., `user: User`)
- Column: `@Column({ name: 'user_id', type: 'integer' }) userId: number`
- Relationship: `@ManyToOne(() => User) @JoinColumn({ name: 'user_id' }) user: User`
- Always specify `@JoinColumn({ name: 'foreign_key_name' })` with the database column name

**One-to-Many:**
- Use `@OneToMany(() => ChildEntity, child => child.parent)` decorator
- Property type: `ChildEntity[]`

**Many-to-Many:**
- Use `@ManyToMany()` with `@JoinTable()` for simple cases
- Or use intermediate entity with `@OneToMany()` relationships for additional columns on junction table

### Response Getters

Many entities implement getters for safe data serialization. These getters exclude sensitive fields (like passwords) and only return safe data for API responses.

**Naming conventions:**
- Use `baseGroup` getter when entity appears in groups/lists (common pattern in this codebase)
- Use `toResponse` getter for entities returned directly as single objects
- Check existing entities in the codebase to maintain consistency
- Never include passwords, tokens, or other sensitive data in response getters

### Enum Types

- Define enums separately (e.g., `export enum EntityStatus`)
- Use string columns with enum values in entities
- Provide default values when appropriate

### Indexes

- Add indexes for frequently queried columns
- Use `@Index()` decorator for simple indexes
- Use `@Index(['column1', 'column2'])` for composite indexes

### Unique Constraints

- Use `unique: true` in `@Column()` decorator
- Or use `@Unique()` decorator for composite unique constraints

### Soft Deletes

Since `BasicEntity` includes `deletedAt`, entities support soft deletes:
- Use `repository.softDelete(id)` instead of `delete()`
- Find operations exclude soft-deleted by default
- Use `withDeleted: true` option to include soft-deleted records
- Use `repository.restore(id)` to restore soft-deleted records

## Common Entities

- `User`, `Role`, `UsersRoles`: User and role management
- `RefreshToken`, `UserActivationToken`: Authentication tokens
- `ApiKey`, `Client`: API management
- `Document`, `File`, `Attachment`, `Group`, `DocumentsGroups`: Document management
- `AnalyticsRequestLog`, `AnalyticsUserSummary`: Analytics
- `UserBudget`: Budget management

## Important Guidelines

- Always extend `BasicEntity` unless there's a specific reason not to
- Use snake_case for database column names
- Use camelCase for TypeScript property names
- Always specify `type` explicitly in `@Column()`
- Mark nullable columns with `nullable: true`
- Use proper TypeORM relationship decorators
- Implement `baseGroup` or `toResponse` getters for safe serialization
- Never include passwords or tokens in response getters
- Define enums separately, use string columns with enum values
- Add indexes for frequently queried columns
- Use soft deletes (via deletedAt) instead of hard deletes when possible
- Always specify `@JoinColumn({ name: 'foreign_key_name' })` for relationships
