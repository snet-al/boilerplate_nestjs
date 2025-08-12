# External AI Gateway Integration

This NestJS application integrates with an external AI gateway for user management and API key provisioning.

## Overview

When users sign up through the authentication system, the application automatically:
1. Creates a local user in the NestJS database
2. Creates a corresponding user in LiteLLM with an API key
3. Stores the LiteLLM user ID and API key in the local database

## Setup

### 1. Docker Compose Setup (Recommended)

The easiest way to run the application with LiteLLM is using Docker Compose:

```bash
docker-compose up
```

This will start:
- MariaDB database (port 33065)
- LiteLLM proxy server (port 4000)
- NestJS application (port 5050)

### 2. Manual Setup

If you want to run LiteLLM separately:

1. Install and run LiteLLM:
```bash
pip install litellm[proxy]
litellm --config litellm_config.yaml --port 4000
```

2. Update your `.env` file:
```bash
LITELLM_BASE_URL=http://localhost:4000
LITELLM_API_KEY=sk-1234567890abcdef
EXTERNAL_USER_PROVIDER=litellm
DEFAULT_USER_BUDGET=10.0
FAIL_ON_EXTERNAL_USER_ERROR=false
```

## Configuration

### Environment Variables

- `AI_GATEWAY_BASE_URL` (or `EXTERNAL_AI_BASE_URL`): URL of the external gateway (fallbacks to `LITELLM_BASE_URL`)
- `AI_GATEWAY_API_KEY` (or `EXTERNAL_AI_API_KEY`): API key for gateway (fallbacks to `LITELLM_API_KEY`)
- `EXTERNAL_USER_PROVIDER`: Provider type (currently 'litellm' supported)
- `DEFAULT_USER_BUDGET`: Default budget assigned to new users (in USD)
- `FAIL_ON_EXTERNAL_USER_ERROR`: Whether to fail user registration if LiteLLM is unavailable

### LiteLLM Configuration

Edit `litellm_config.yaml` to:
- Add your actual model providers (OpenAI, Anthropic, etc.)
- Configure model routing and load balancing
- Set up teams and permissions

## API Usage

Once a user is created, they receive:
- A local JWT token for NestJS authentication
- A LiteLLM API key for accessing AI models

The LiteLLM API key is stored in the user's profile and can be accessed through the user management endpoints.

### Key Management API (proxy to external gateway)

Backend exposes convenient endpoints under `/keys/*` that proxy to LiteLLM `/key/*`:

- `POST /keys/generate` → gateway `/key/generate`
- `POST /keys/service-account/generate` → gateway `/key/service-account/generate`
- `POST /keys/update` → gateway `/key/update`
- `POST /keys/delete` → gateway `/key/delete`
- `GET /keys/info` → gateway `/key/info`
- `POST /keys/:key/regenerate` → gateway `/key/{key}/regenerate`
- `GET /keys/list` → gateway `/key/list`
- `POST /keys/block` → gateway `/key/block`
- `POST /keys/unblock` → gateway `/key/unblock`
- `POST /keys/health` → gateway `/key/health`

These require `LITELLM_BASE_URL` and `LITELLM_API_KEY` to be set. See `docker-compose.yaml` for defaults.

## User Management API

The application provides several endpoints for managing external users:

- **Sync existing user**: `POST /users/{id}/sync-external`
- **Get external user info**: `GET /users/{id}/external-info`
- **Cleanup external user**: `DELETE /users/{id}/external`

## Error Handling

The application is configured to continue user registration even if LiteLLM is unavailable (graceful degradation). This can be changed by setting `FAIL_ON_EXTERNAL_USER_ERROR=true`.

When LiteLLM is unavailable:
- User registration continues normally
- External user fields remain null
- Users can be synced later when LiteLLM becomes available

## Monitoring

Check the application logs for LiteLLM integration status:
- User creation events
- Connection errors
- API responses

## Security Notes

- The LiteLLM master key is stored in environment variables
- User API keys are stored encrypted in the database
- All LiteLLM communication uses HTTPS in production

## Future Extensibility

The external user management service is designed to be provider-agnostic. To add support for other providers:

1. Implement the `ExternalUserProvider` interface
2. Add the provider to the `ExternalUserManagementService` constructor
3. Update the `EXTERNAL_USER_PROVIDER` environment variable