# Sequelize Migrations Guide

This document explains how Sequelize migrations are wired into the Blog-App and
what each npm script does.

## Why migrations?

Earlier the app relied on `sequelize.sync()` to create tables from models at
boot. That is fine for prototypes but in real environments you need a
**versioned, ordered, reversible** record of every schema change so multiple
environments (dev, staging, prod, CI, teammates) can converge on the same
schema. Migrations give you that — each change is a file with an `up` and a
`down`, executed in order, tracked in a `SequelizeMeta` table in the database.

That is also why `sync` is now `false` in
[src/config/lib/sequelize.js](src/config/lib/sequelize.js) — schema is owned by
migration files, not by model auto-sync.

---

## File-by-file roles

### [.sequelizerc](.sequelizerc)

This file tells the **`sequelize-cli`** binary where to find things in *this*
project. Without it, the CLI assumes a default layout (`config/config.json`,
`./models`, `./migrations`, `./seeders`) that does not match this repo.

```js
const path = require('path');

module.exports = {
  config: path.resolve('src/config/lib', 'sequelize-config.js'),
  'models-path': path.resolve('src/modules'),
  'migrations-path': path.resolve('migrations'),
  'seeders-path': path.resolve('seeders'),
};
```

| Key                | Points to                       | Used by                           |
| ------------------ | ------------------------------- | --------------------------------- |
| `config`           | `src/config/lib/sequelize-config.js` | All `db:*` commands — to know how to connect |
| `models-path`      | `src/modules`                   | `model:generate` (when used)       |
| `migrations-path`  | `migrations/`                   | `migration:generate`, `db:migrate*` |
| `seeders-path`     | `seeders/`                      | `db:seed*`                         |

The `migrations/` folder doesn't exist until you generate the first migration.
The CLI creates it on demand.

### [src/config/lib/sequelize-config.js](src/config/lib/sequelize-config.js)

This is the **CLI's** connection config — separate from the runtime
`sequelize.js` your app uses. The CLI exec is a standalone process; it doesn't
import your app, so it needs its own way to learn DB credentials.

It exports environments (`development`, `test`, `production`) and the CLI picks
one based on `NODE_ENV` (defaults to `development`). All values are read from
environment variables so the same file works everywhere.

### [src/config/lib/sequelize.js](src/config/lib/sequelize.js)

This is the **app's** runtime Sequelize instance — used by models when the
Express server is running. It also reads the same env vars, so app and CLI talk
to the same database.

### `migrations/<timestamp>-<name>.js` (created on demand)

Each file has the shape:

```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // forward change — create table, add column, etc.
  },
  async down(queryInterface, Sequelize) {
    // inverse — undo whatever `up` did
  },
};
```

The timestamp prefix gives a deterministic ordering. The CLI records each
applied filename in a `SequelizeMeta` table in the DB and only runs files that
aren't yet recorded.

---

## The npm scripts

All scripts live in [package.json](package.json) and shell out to
`sequelize-cli`. They use the paths from `.sequelizerc` and the credentials from
`sequelize-config.js`.

### `npm run migration:generate -- <name>`

Maps to `sequelize-cli migration:generate --name <name>`.

Creates an empty migration file in `migrations/` named
`<timestamp>-<name>.js`. You then edit the `up` / `down` bodies. **Nothing
touches the database yet.**

> The `--` is required so npm forwards the name to the script instead of
> consuming it.

Example:

```bash
npm run migration:generate -- create-users-table
# → migrations/20260501123045-create-users-table.js
```

### `npm run db:migrate`

Maps to `sequelize-cli db:migrate`.

Runs the `up` of every migration file that is **not yet in `SequelizeMeta`**, in
timestamp order. After each one succeeds, it inserts the filename into
`SequelizeMeta`, so re-running is a no-op.

Use this:
- after pulling new migration files from a teammate
- as part of your deploy step
- after generating and editing your own new migration

### `npm run db:migrate:status`

Maps to `sequelize-cli db:migrate:status`.

Prints every migration in `migrations/` and marks each as `up` (already
applied) or `down` (pending). Read-only. A good sanity check before running
`db:migrate` or before assuming the DB is in a known state.

### `npm run db:migrate:undo`

Maps to `sequelize-cli db:migrate:undo`.

Reverts the **most recent** applied migration by running its `down`, then
removes the row from `SequelizeMeta`. Use this when you ran `db:migrate`,
realized the latest file is wrong, want to fix it, and re-run.

### `npm run db:migrate:undo:all`

Maps to `sequelize-cli db:migrate:undo:all`.

Runs `down` on **every** applied migration, in reverse order. This effectively
empties the schema (assuming all `down`s are correct). Mostly useful in dev /
CI when you want to rebuild from scratch. **Never run this in production.**

---

## Typical workflows

### Adding a new table

```bash
npm run migration:generate -- create-posts-table
# edit migrations/<ts>-create-posts-table.js
npm run db:migrate:status   # shows the new file as "down"
npm run db:migrate          # applies it
npm run db:migrate:status   # now shows "up"
```

### Fixing a freshly written migration

```bash
npm run db:migrate:undo     # undoes the last apply
# edit the file
npm run db:migrate          # re-apply the fixed version
```

### Onboarding a new dev / fresh database

```bash
createdb blog_app            # or however the DB gets created
npm run db:migrate          # builds the entire schema from scratch
```

---

## Required environment variables

Set in [.env](.env) (loaded via `dotenv`):

```
DB_HOST = localhost
DB_NAME = blog_app
DB_USER = postgres
DB_PASSWORD = ...
```

Both [src/config/lib/sequelize.js](src/config/lib/sequelize.js) (runtime) and
[src/config/lib/sequelize-config.js](src/config/lib/sequelize-config.js) (CLI)
read these.
