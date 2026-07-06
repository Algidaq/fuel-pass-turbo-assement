# Repository Guidelines

## Project Structure & Module Organization

This is an npm workspaces Turborepo for Fuel Pass services and shared packages. API services live in `apps/api/`: `auth-service` and `orders-service` are NestJS applications with `src/` for runtime code, `tests/` for unit and integration specs, and `src/database/` for TypeORM data sources, migrations, and seed scripts. Shared libraries live in `packages/`, including `node-commons`, `contracts`, `eslint-config`, `typescript-config`, and `ui`. Generated build output goes to `dist/` and should not be edited directly.

## Build, Test, and Development Commands

- `npm run build`: runs `turbo run build` across services and packages.
- `npm run dev`: starts persistent development tasks through Turbo.
- `npm run lint`: runs ESLint for all configured workspaces.
- `npm run test`: builds dependencies, then runs Jest tests through Turbo.
- `npm run check-types`: runs workspace type-check tasks.
- `npm run format`: formats TypeScript, TSX, and Markdown with Prettier.

For one workspace, use npm workspace targeting, for example `npm run test -w @fuel-pass/auth-service` or `npm run start:dev -w @fuel-pass/orders`.

## Coding Style & Naming Conventions

Use TypeScript and follow the existing NestJS module layout: `*.module.ts`, `*.controller.ts`, `*.service.ts`, guards in `guards/`, entities in `entities/`, and repositories in `repositories/`. Prettier is configured for 4-space indentation, 140-character print width, single quotes, LF endings, and ES5 trailing commas. ESLint uses shared `@fuel-pass/eslint-config/backend`; run lint before submitting changes.

## Testing Guidelines

Jest is the test framework. Place unit tests under `tests/unit/...` and integration tests under `tests/integration/...`; name files `*.spec.ts` or `*.test.ts` to match the current conventions. Use `npm run test -w <workspace>` for focused runs and `npm run test:cov -w @fuel-pass/auth-service` or `npm run test:coverage -w @fuel-pass/node-commons` when coverage is relevant. Keep service tests isolated; SQLite integration specs are already used for database-backed flows.

## Commit & Pull Request Guidelines

Recent history mostly uses Conventional Commit-style subjects such as `feat(auth-service): add seed script` and `fix(ci): update command`. Prefer `feat`, `fix`, `refactor`, `chore`, or `test`, with a scope when useful. Pull requests should include a concise description, affected workspace(s), test commands run, linked issues if any, and screenshots or API examples when behavior changes.

## Security & Configuration Tips

Service scripts expect environment files for database and seed operations. Keep local `.env` files and secrets out of commits, and prefer the checked-in example or service-specific env templates when documenting required variables.
