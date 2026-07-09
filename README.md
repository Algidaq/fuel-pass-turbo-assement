# Fuel Pass Coding Challenge

A full-stack TypeScript implementation of an aviation fuel order workflow.

The application lets an aircraft operator submit a refueling request, then lets an operations user review, filter, and progress the order through the allowed lifecycle:

```text
Pending -> Confirmed -> Completed
```

The implementation is intentionally structured as a small monorepo rather than a single flat CRUD app. The goal is to keep the domain logic, API contracts, backend utilities, and UI code separated so the system can be extended later with more order fields, reporting, authentication rules, or operational workflows.

## Contents

- [What is included](#what-is-included)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Workspace structure](#workspace-structure)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Seeded users](#seeded-users)
- [Reviewer walkthrough](#reviewer-walkthrough)
- [Useful URLs](#useful-urls)
- [Testing and validation](#testing-and-validation)
- [Database setup](#database-setup)
- [API overview](#api-overview)
- [Design decisions](#design-decisions)
- [Assumptions](#assumptions)
- [Troubleshooting](#troubleshooting)

## What is included

### User Story 1 - Submit a Fuel Order

Implemented end-to-end:

- Fuel order submission form in the web app.
- Fields for:
    - Tail Number
    - Airport ICAO Code
    - Requested Fuel Volume
    - Delivery Time Window
- API validation before persistence.
- Orders are stored with:
    - Unique identifier
    - Created timestamp
    - Initial status of `PENDING`
- Validation errors are returned by the API and shown in the UI.

### User Story 2 - View and Manage Orders

Implemented end-to-end:

- Orders table/list view.
- Airport ICAO filtering.
- Order detail view.
- Status update flow:
    - `PENDING -> CONFIRMED`
    - `CONFIRMED -> COMPLETED`
- Invalid status transitions are blocked.
- Status changes are persisted in the database.
- Status history is recorded for traceability.

Additional implementation work:

- Auth service with local seeded users.
- JWT-based access.
- Role/permission-based access checks.
- Proxy service so the frontend can use one local API base URL.
- Shared contracts package for DTOs, permissions, and error vocabulary.
- Shared backend utilities package for common NestJS concerns.

## Screenshots

| Login | Submit Order |
| --- | --- |
| ![Login screen](./screenshot/Login.png) | ![Submit order screen](./screenshot/submit-order-screen.png) |

| Orders | Order Detail |
| --- | --- |
| ![Orders screen](./screenshot/orders.png) | ![Order detail screen](./screenshot/order-detail.png) |

## Architecture

```text
apps/web/web-app
        |
        | HTTP
        v
apps/api/proxy-service
        |
        |-- /auth-service/*  -----> apps/api/auth-service -----> fuel_pass_auth
        |
        |-- /orders-service/* ----> apps/api/orders-service ---> fuel_pass_orders
                                             |
                                             |-- internal auth introspection
```

### Main components

| Workspace | Purpose |
| --- | --- |
| `apps/web/web-app` | React web app for login, order submission, order list, and order detail/status management. |
| `apps/api/auth-service` | Owns users, credentials, sessions, JWTs, roles, permissions, and auth introspection. |
| `apps/api/orders-service` | Owns fuel order creation, listing, filtering, lookup, status transitions, and status history. |
| `apps/api/proxy-service` | Local HTTP gateway that forwards frontend traffic to the correct backend service. |
| `packages/contracts` | Shared DTO schemas, permission keys, status values, and error contracts. |
| `packages/node-commons` | Shared NestJS/backend utilities such as guards, headers, validation, and response helpers. |
| `packages/ui` | Shared React UI primitives/components. |
| `packages/typescript-config` | Shared TypeScript configuration. |
| `packages/eslint-config` | Shared lint configuration. |

## Workspace structure

```text
.
|-- apps
|   |-- api
|   |   |-- auth-service
|   |   |-- orders-service
|   |   `-- proxy-service
|   `-- web
|       `-- web-app
|-- packages
|   |-- contracts
|   |-- eslint-config
|   |-- node-commons
|   |-- typescript-config
|   `-- ui
|-- scripts
|-- screenshot
|-- docker-compose.yml
|-- docker.env
|-- package.json
`-- turbo.json
```

## Requirements

- Node.js `^20.19.0`, `^22.13.0`, or `>=24`
- npm `^10.9.0`
- Docker, for the recommended local PostgreSQL setup
- PostgreSQL, if running the databases without Docker

SQLite is also supported for quick local review and isolated integration testing, but PostgreSQL is the recommended path for reviewing the challenge.

## Quick start

From the repository root:

```bash
npm install
npm run setup:envs
npm run docker:up
npm run db:setup
npm run dev
```

Then open:

```text
http://localhost:5173
```

The generated local environment files are created from `.env.example`:

```text
apps/api/auth-service/.env
apps/api/orders-service/.env
apps/api/proxy-service/.env
apps/web/web-app/.env
```

Default local ports:

| Service | URL |
| --- | --- |
| Auth service | `http://localhost:3000/api` |
| Orders service | `http://localhost:3001/api` |
| Proxy service | `http://localhost:3100` |
| Web app | `http://localhost:5173` |
| PostgreSQL host port | `5433` |

## Seeded users

The seed scripts create local users for the main review scenarios.

| Role | Email | Password | Intended use |
| --- | --- | --- | --- |
| Admin | `admin@fuelpass.local` | `Password123!` | Full local access. |
| Aircraft Operator | `aircraft.operator@fuelpass.local` | `Password123!` | Create and review own fuel orders. |
| Operations Manager | `operations.manager@fuelpass.local` | `Password123!` | Review orders and update order status. |

## Reviewer walkthrough

Use this path to verify the main acceptance criteria quickly.

### 1. Start the application

```bash
npm install
npm run setup:envs
npm run docker:up
npm run db:setup
npm run dev
```

### 2. Log in as an aircraft operator

Open:

```text
http://localhost:5173
```

Use:

```text
aircraft.operator@fuelpass.local
Password123!
```

### 3. Submit a fuel order

Create an order with valid values, for example:

```text
Tail Number: A6-FPA
Airport ICAO Code: OMDB
Requested Fuel Volume: 12000
Delivery Time Window: any future valid window
```

Expected result:

- The order is created.
- The initial status is `PENDING`.
- The order has an identifier and timestamp.
- The order appears in the orders view.

### 4. Check validation

Try invalid values, for example:

```text
Airport ICAO Code: DXB
Requested Fuel Volume: 0
```

Expected result:

- The API rejects the request.
- The UI shows validation feedback.

### 5. Log in as operations manager

Use:

```text
operations.manager@fuelpass.local
Password123!
```

Verify:

- Orders can be listed.
- Orders can be filtered by ICAO code, for example `OMDB`.
- An order can be opened from the list.

### 6. Progress order status

Update the order through the valid flow:

```text
PENDING -> CONFIRMED -> COMPLETED
```

Expected result:

- Each valid transition is persisted.
- The updated status is reflected in the list/detail views.
- Invalid transitions are blocked.

## Useful URLs

### Web app

```text
http://localhost:5173
```

### Health checks

```bash
curl http://localhost:3000/api/health
curl http://localhost:3001/api/health
curl http://localhost:3100/health
curl http://localhost:3100/health/deep
```

### Proxy health routes

```bash
curl http://localhost:3100/auth-service/api/health
curl http://localhost:3100/orders-service/api/health
```

## Testing and validation

Run the full test suite:

```bash
npm run test
```

Run focused workspace tests:

```bash
npm run test -w @fuel-pass/auth-service
npm run test -w @fuel-pass/orders
npm run test -w @fuel-pass/proxy-service
```

Run coverage for backend services:

```bash
npm run test:cov -w @fuel-pass/auth-service
npm run test:cov -w @fuel-pass/orders
npm run test:cov -w @fuel-pass/proxy-service
```

Run the main quality checks:

```bash
npm run check-types
npm run lint
npm run build
```

Format the repository:

```bash
npm run format
```

## Database setup

### PostgreSQL with Docker

The recommended local setup uses Docker Compose:

```bash
npm run docker:up
```

This starts:

| Container | Purpose |
| --- | --- |
| `postgres` | PostgreSQL 16 exposed on host port `5433`. |
| `db-init` | One-shot setup container that creates the service databases if they do not exist. |

Then run migrations and seed data:

```bash
npm run db:setup
```

The root `db:setup` command runs setup for both service databases:

```bash
npm run db:setup -w @fuel-pass/auth-service
npm run db:setup -w @fuel-pass/orders
```

Each service runs its TypeORM migrations first, then its seed script.

### SQLite option

SQLite can be used for a lighter local review.

Generate env files first:

```bash
npm run setup:envs
```

Then edit `apps/api/auth-service/.env`:

```env
DB_TYPE=sqlite
SQLITE_DATABASE=./auth.sqlite
SQLITE_SYNCHRONIZE=true
```

Comment out or remove the PostgreSQL values in the same file:

```env
# DB_TYPE=postgres
# DB_HOST=localhost
# DB_PORT=5433
# DB_USERNAME=postgres
# DB_PASSWORD=postgres
# DB_DATABASE=fuel_pass_auth
# DB_SSL=false
```

Do the same for `apps/api/orders-service/.env`:

```env
DB_TYPE=sqlite
SQLITE_DATABASE=./orders.sqlite
SQLITE_SYNCHRONIZE=true
```

Then seed local data:

```bash
npm run seed -w @fuel-pass/auth-service
npm run seed -w @fuel-pass/orders
```

SQLite database files are local development artifacts and should not be committed.

## API overview

The frontend calls the proxy service. The proxy forwards requests to the correct backend service.

### Orders service

Base route through the proxy:

```text
/orders-service/api
```

Main fuel order routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/v1/fuel-orders` | Create a new fuel order. |
| `GET` | `/v1/fuel-orders` | List fuel orders, with optional filtering. |
| `GET` | `/v1/fuel-orders/:id` | Get a single fuel order. |
| `PATCH` | `/v1/fuel-orders/:id/status` | Update order status through the allowed lifecycle. |

### Auth service

Base route through the proxy:

```text
/auth-service/api
```

The auth service owns login, token issuance, role/permission data, and internal introspection used by backend services.

## Design decisions

### Monorepo

A Turbo/npm workspace monorepo was used so the frontend, backend services, contracts, UI primitives, and backend utilities can evolve together while remaining separated by responsibility.

### Separate auth and orders services

The challenge could be solved with a single backend. This implementation uses separate services to show how the fuel order domain can remain independent from identity and access control.

- Auth owns users, sessions, roles, permissions, and tokens.
- Orders owns fuel orders, status rules, status history, and order visibility rules.
- Orders asks auth for identity/permission context through internal auth validation.

### Shared contracts

Request/response DTOs, permissions, order statuses, and common error vocabulary are placed in `@fuel-pass/contracts`. This reduces duplicated definitions across the frontend and backend services.

### Explicit status lifecycle

The order lifecycle is handled as a domain rule, not as a loose free-text status update. This keeps invalid transitions from being persisted and makes it easier to add future statuses later.

Current lifecycle:

```text
PENDING -> CONFIRMED -> COMPLETED
```

### Status history

Status changes are stored separately from the current order status. This keeps the current order row simple while preserving operational traceability.

### Proxy service

The proxy gives the web app a single local API base URL. This keeps frontend configuration simple and avoids coupling the web app to each service port.

## Assumptions

- Tail numbers are accepted as aircraft registration-style identifiers and are validated as application input, not checked against an external registry.
- Airport ICAO codes must be four letters and are normalized/validated by the application.
- Requested fuel volume must be greater than zero.
- Delivery windows are treated as requested operational windows, not guaranteed schedules.
- New orders always start as `PENDING`.
- Only the allowed status transitions are supported.
- Authentication and RBAC were added to demonstrate extensibility, even though the core challenge only required order submission and order management.
- Example secrets and local keys are for development only and must not be reused in production.

## Troubleshooting

### Port already in use

Check whether one of the default ports is already occupied:

```bash
lsof -i :3000
lsof -i :3001
lsof -i :3100
lsof -i :5173
```

Then stop the conflicting process or change the relevant port in the generated `.env` file.

### Database connection fails

Confirm Docker is running:

```bash
npm run docker:ps
```

Check Postgres logs:

```bash
npm run docker:logs
```

Restart the local database:

```bash
npm run docker:down
npm run docker:up
npm run db:setup
```

### Environment files are missing

Regenerate local `.env` files:

```bash
npm run setup:envs
```

### Seeded login does not work

Run database setup again:

```bash
npm run db:setup
```

Then restart the services:

```bash
npm run dev
```

## Cleanup commands

Stop local Docker services:

```bash
npm run docker:down
```

Remove local SQLite files if used:

```bash
find . -name "*.sqlite" -delete
```

## Notes for production hardening

This is a coding challenge implementation. For a production system, the next steps would include:

- Stronger secret management.
- Production-grade token/key rotation.
- Structured logging and tracing.
- API rate limiting.
- More granular audit logs.
- More exhaustive end-to-end tests.
- CI checks for migration drift.
- Deployment-specific configuration for each service.
