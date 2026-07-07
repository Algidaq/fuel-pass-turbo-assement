# Orders SQLite Migration Notes

## Current Workflow

Run schema migrations and seed data before using a local orders database:

```sh
npm run migration:run
npm run seed
```

The shortcut is:

```sh
npm run db:setup
```

Migrations create or change database structure. The seed script inserts representative fuel orders and status history rows.

## Lessons Applied

1. SQLite must load the same migration list as Postgres.

    The SQLite TypeORM branch now includes the shared `src/database/migrations/*{.ts,.js}` glob. Without this, TypeORM can connect to SQLite and create its bookkeeping table while finding no application migrations to execute.

2. Schema migrations need database-specific SQL where dialects differ.

    The orders schema migration keeps the existing Postgres SQL for Postgres and adds a SQLite branch for:

    - enum columns as `varchar CHECK (...)`
    - UUID columns as `varchar(36)`
    - timestamp columns as `datetime`
    - ICAO validation with SQLite-compatible checks

3. `migration:generate` needs an output path.

    TypeORM 0.3 requires a positional path argument. The npm script now uses `src/database/migrations/GeneratedMigration` as the default base path.

    To preview generated SQL without writing a file, run:

    ```sh
    npm run migration:generate -- --dr
    ```

4. Seed data should live outside schema migrations.

    `src/database/seed.ts` inserts fixed, idempotent sample orders and status history rows. It provides explicit UUID values so the same script works with both Postgres and SQLite.
