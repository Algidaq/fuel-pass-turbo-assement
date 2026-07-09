# Fuel Pass

Fuel Pass is a TypeScript monorepo for an aviation fuel ordering workflow. The current backend is split into three API workspaces:

- `@fuel-pass/auth-service`: users, credentials, sessions, JWTs, roles, permissions, and internal auth introspection.
- `@fuel-pass/orders`: fuel order creation, listing, lookup, status transitions, and permission-aware access rules.
- `@fuel-pass/proxy-service`: a lightweight HTTP gateway that forwards `/auth-service` and `/orders-service` traffic to the service ports.

Shared code lives in `packages/`, especially `@fuel-pass/contracts` for DTOs, permissions, and error catalogs, and `@fuel-pass/node-commons` for common backend utilities.

## Tooling Note

The project uses an npm workspaces Turborepo layout. The NestJS services were bootstrapped with the Nest CLI/schematics and then adapted for the Fuel Pass domain. The generated structure is intentionally conventional; most project-specific work is in the auth, permission, order, persistence, and proxy-routing logic.

## Requirements

- Node.js `>=18`
- npm `10.x` recommended
- PostgreSQL if you want to run the services against Postgres
- SQLite is supported by the services for lightweight local and integration-test workflows

## Setup

Install dependencies from the repository root:

```sh
npm install
```

Generate service `.env` files from the root `.env.example`:

```sh
npm run setup:envs
```

The generated envs configure:

- auth service on `http://localhost:3000/api`
- orders service on `http://localhost:3001/api`
- proxy service on `http://localhost:3100`
- web app API base URL as `http://localhost:3100`

For Postgres, create the configured databases before running migrations:

```sh
createdb fuel_pass_auth
createdb fuel_pass_orders
```

Then run service migrations and seed data:

```sh
npm run db:setup -w @fuel-pass/auth-service
npm run db:setup -w @fuel-pass/orders
```

For a SQLite-only local run, set `DB_TYPE=sqlite`, `SQLITE_DATABASE=./auth.sqlite` or `./orders.sqlite`, and `SQLITE_SYNCHRONIZE=true` in the relevant service `.env`. This is useful for quick review, but Postgres plus migrations is the closer production-like path.

## Run

Start all persistent development tasks through Turbo:

```sh
npm run dev
```

Or run individual services:

```sh
npm run start:dev -w @fuel-pass/auth-service
npm run start:dev -w @fuel-pass/orders
npm run dev -w @fuel-pass/proxy-service
```

Useful health checks:

```sh
curl http://localhost:3000/api/health
curl http://localhost:3001/api/health
curl http://localhost:3100/health
curl http://localhost:3100/health/deep
```

Traffic through the proxy is namespaced, for example:

```sh
curl http://localhost:3100/auth-service/api/health
curl http://localhost:3100/orders-service/api/health
```

## Test And Validate

Run the full workspace test task:

```sh
npm run test
```

Run focused tests:

```sh
npm run test -w @fuel-pass/auth-service
npm run test -w @fuel-pass/orders
npm run test -w @fuel-pass/proxy-service
```

Other validation commands:

```sh
npm run build
npm run lint
npm run check-types
npm run format
```

Coverage is available for the service workspaces:

```sh
npm run test:cov -w @fuel-pass/auth-service
npm run test:cov -w @fuel-pass/orders
npm run test:cov -w @fuel-pass/proxy-service
```

## Assumptions

- Auth is the source of truth for users, roles, permissions, sessions, and token issuance.
- Orders stores order data and asks auth for user/permission context through the internal auth API.
- The proxy keeps public routing simple while each service remains independently runnable.
- Permission keys and error codes belong in `@fuel-pass/contracts` so services and clients can share the same vocabulary.
- Local dev secrets and RSA keys in examples are development-only material and must not be reused for production.
- Database migrations are the preferred Postgres setup path. SQLite synchronization is only for local review and tests.

## Rationale

- Turborepo and npm workspaces keep independent services and shared packages in one repository while preserving targeted commands per workspace.
- NestJS was chosen for auth and orders because modules, controllers, providers, guards, and TypeORM integration fit the service boundaries cleanly.
- Shared contracts reduce drift between services for DTOs, permissions, and domain error codes.
- Auth and orders are separate services because authentication/authorization state changes at a different rate than fuel order workflow state.
- The proxy service is intentionally small Express middleware so gateway behavior stays transparent and easy to test.
- TypeORM is used with Postgres for realistic persistence and SQLite support for fast isolated integration tests.
