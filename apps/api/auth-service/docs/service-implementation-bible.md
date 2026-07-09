# Auth Service Implementation Bible

This document defines the default implementation style for new auth-service endpoints and service workflows.

## Endpoint Shape

- A controller method is transport glue only: validate request DTOs, extract `@CsHeaders()`, `@Req()` principals when needed, call one endpoint service, and return that service's `ApiResponse`.
- A controller must not contain workflow logic, persistence logic, manual request validation, or audit decisions.
- Each endpoint gets one focused endpoint service, named after the use case: `AuthLoginService`, `AuthRefreshService`, `AuthLogoutService`, `AuthIntrospectionService`, and similar.
- Endpoint services expose one primary public method. The method accepts `WithAppCtx<{ body: TRequestDto }>` plus explicit additions like `principal` when the endpoint requires authenticated context.

## Contracts

- Request schemas live in `packages/contracts` beside the response DTO for the endpoint.
- Request validation uses Zod through `ZodValidationPipe`; do not duplicate manual controller validation when a schema can express it.
- Export an inferred request type from each schema using the `T<Name>RequestDto` naming pattern.
- Response DTOs extend `BaseResModel` and implement `copyWith`. Add `toJSON()` when the wire shape differs from the TypeScript property names.
- Preserve public wire compatibility. Internal TypeScript names may be camelCase, but existing API fields such as `access_token`, `refresh_token`, `expires_in`, and `token_type` stay stable.

## Service Responsibilities

- Endpoint services orchestrate the use case and return `ApiResponse<TResponseDto>`.
- Shared services are capability helpers, not request workflow containers. Examples: `TokenService`, `PasswordService`, `RefreshTokenService`, `SessionService`, `CurrentUserService`, and `AuditService`.
- Do not add endpoint workflows back into a generic `AuthService` facade.
- Keep validation that depends on database state inside the endpoint service or a dedicated domain helper. Keep schema-level validation in contracts.
- Map expected auth failures to catalogued auth errors. Prefer `AuthException`/`AppHttpError` and `ApiResponse.fromAppError` for endpoint service failures.

## Persistence And Transactions

- If a workflow writes multiple related rows that must succeed or fail together, put that write group behind a transaction-focused service.
- Use an abstract service contract when another service should depend on the transaction boundary rather than the concrete TypeORM implementation.
- The transaction service owns TypeORM `QueryRunner` or `DataSource.transaction` usage. Endpoint services should call it as one operation.
- Store refresh token hashes only. Return raw refresh tokens to clients exactly once, at issuance.

## Testing

- Unit tests target endpoint services directly and mock shared helpers.
- Controller tests should assert delegation and response pass-through, not re-test service workflow branches.
- Integration tests cover persistence-backed flows: login session creation, refresh rotation/reuse, logout revocation, and internal user creation.
- Required focused checks after auth endpoint changes:
    - `npm run test -w @fuel-pass/auth-service`
    - `npm run typecheck -w @fuel-pass/auth-service`
    - `npm run build -w @fuel-pass/contracts`
