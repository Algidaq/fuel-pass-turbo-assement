# Orders Service Implementation Bible

This document defines the default implementation style for orders-service endpoints and service workflows.

## Endpoint Shape

- A controller method is transport glue only: validate request DTOs, extract `@CsHeaders()`, authenticated principals, params, and query values, call one endpoint service, and return that service's `ApiResponse`.
- A controller must not contain workflow logic, persistence logic, manual request validation, status transition decisions, or error-to-response mapping.
- Each endpoint gets one focused endpoint service, named after the use case: `CreateFuelOrderService`, `ListFuelOrdersService`, `GetFuelOrderService`, `UpdateFuelOrderStatusService`, and similar.
- Endpoint services expose one primary public method. The method accepts `WithAppCtx` plus explicit fields such as `body`, `query`, `id`, and `principal`.

## Contracts

- Request schemas live in `packages/contracts` beside the response DTO for the endpoint.
- Request validation uses Zod through `ZodValidationPipe`; do not duplicate manual controller validation when a schema can express it.
- Export inferred request types using the `T<Name>RequestDto` naming pattern, and keep compatibility aliases when existing consumers import the old names.
- Response DTOs extend `BaseResModel` and implement `copyWith`.
- Preserve public wire compatibility. Existing fields such as `requestedFuelVolume`, `deliveryWindowStartAt`, and `airportIcaoCode` stay stable.

## Service Responsibilities

- Endpoint services orchestrate the use case and return `ApiResponse<TResponseDto>`.
- Shared services and repositories are capability helpers, not request workflow containers.
- Do not add endpoint workflows back into a generic `FuelOrdersService` facade.
- Keep schema-level request validation in contracts. Keep database-state validation and transition decisions inside the endpoint service or a focused domain helper.
- Map expected order failures to catalogued order errors using `OrderException`/`AppHttpError` and `ApiResponse.fromAppError`.

## Persistence And Transactions

- If a workflow writes multiple related rows that must succeed or fail together, keep that write group inside one transaction.
- Endpoint services may own simple transaction orchestration when the transaction exists solely for that endpoint.
- Create order and initial status history together.
- Status updates must use conditional persistence for concurrency safety and must write status history only when a real status transition occurs.

## Testing

- Unit tests target endpoint services directly and mock repositories or transaction boundaries.
- Controller tests assert validation/delegation shape and response pass-through, not workflow branches.
- Integration tests cover persistence-backed flows with SQLite: create, filtering, pagination, status history, and conditional status updates.
- Required focused checks after orders endpoint changes:
    - `npm run build -w @fuel-pass/contracts`
    - `npm run build -w @fuel-pass/orders`
    - `npm run test -w @fuel-pass/orders -- --watchman=false`
    - `npm run lint -w @fuel-pass/orders`
