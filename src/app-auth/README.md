# App Auth Module (`app-auth/`)

## Overview

The `app-auth` module handles authentication and authorization functionality. It contains sub-modules for authentication flows, user management, role management, guards, and Passport strategies.

## Structure

```
app-auth/
├── app-auth.module.ts       # Main module importing all auth modules
├── auth/                    # Core authentication logic
├── user/                    # User management
├── role/                    # Role management
├── guards/                  # Authentication guards
└── strategies/              # Passport strategies
```

## Rules and Guidelines

### Adding New Components

**Subfolder Decision Guide:**
- `auth/`: Authentication flows (login, signup, logout, password reset, token management, account activation)
- `user/`: User CRUD operations, user profile management, user-specific endpoints, user synchronization
- `role/`: Role CRUD operations, role management, role assignment
- `guards/`: New authentication or authorization guards (must implement `CanActivate` interface)
- `strategies/`: New Passport strategies (JWT, OAuth, etc.)

When adding new features:
- Add new guards in `guards/` folder - must implement `CanActivate` interface
- Add new Passport strategies in `strategies/` folder
- Follow existing patterns for user/role management when adding similar resources
- Create DTOs in `dto/` subfolders with proper validation decorators
- Register new modules/components in the appropriate parent module

### Security Requirements

- Always hash passwords with bcrypt before storing (never store plain passwords)
- Always validate tokens - check expiration and signature on every request
- Access tokens should be short-lived, refresh tokens long-lived
- Store refresh tokens hashed in database
- Error messages should not expose sensitive information
- Never log or return passwords

### Adding Auth Endpoints

- Add endpoints to appropriate controllers following existing patterns
- Use `@UseGuards(JwtAuthGuard)` for protected endpoints
- Use `@ApiBearerAuth()` for Swagger documentation
- Always use `@UsePipes(new ValidationPipe())` for DTO validation
- Use `BaseController.success()`, `error()`, `notFound()` for responses

### DTOs

- Create DTOs in `dto/` folders: `Create*Dto`, `Update*Dto`, `Response*Dto`
- Use `@ApiProperty()` decorators for Swagger
- Use `class-validator` decorators for validation
- Update DTOs should have all fields optional

### External Integration

- Check if `externalUserId` exists before performing external user operations
- Sync with external systems when creating users when applicable

## Dependencies

- `@nestjs/jwt`, `@nestjs/passport`: Authentication framework
- `bcrypt`: Password hashing
- `@nestjs-modules/mailer`: Email functionality

## Environment Variables

- `JWT_SECRET`, `JWT_ACCESS_TOKEN_EXPIRATION`, `JWT_REFRESH_TOKEN_EXPIRATION`
- `FRONT_BASE_URL`: Frontend URL for email links
