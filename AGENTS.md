# Repository Guidelines

## Project Structure & Module Organization
- `scripts/`: TypeScript data import/cleanup utilities (run with `tsx`)
- `prisma/`: Prisma schema (`schema.prisma`), migrations, and SQLite views (`views.sql`)
- `data/`: source CSVs and the local SQLite database (`gapmap.db`)
- `demo/`: Express server (`server.js`) + static map UI (`index.html`)
- `docs/` and `初始数据/`: design notes and raw datasets

## Build, Test, and Development Commands
- Install dependencies: `npm install`
- Configure local env (repo root, ignored by git): create `.env` with:
  - `DATABASE_URL="file:./data/gapmap.db"`
  - `AMAP_KEY="..."`, `AMAP_SECURITY_CODE="..."` (required for the demo map)
- Apply schema/migrations: `npx prisma migrate dev` (uses `DATABASE_URL`)
- (Re)create SQLite views used by the demo: `npx prisma db execute --file prisma/views.sql`
- Import data:
  - `npm run import:area` (reads `data/area_level3.csv`)
  - `npm run import` (reads `data/cities_complete.csv`)
  - Optional: `npx tsx scripts/update-city-geo.ts` (reads `data/ok_geo.csv`)
- Inspect DB: `npm run prisma:studio`
- Run the demo: `cd demo && npm install && npm start` → `http://localhost:3000`

## Coding Style & Naming Conventions
- Match existing scripts: 2-space indentation, semicolons, single quotes.
- Naming: `camelCase` for variables/functions, `PascalCase` for Prisma models, `kebab-case.ts` for files in `scripts/`.
- Keep database changes centralized in `prisma/schema.prisma`; update `prisma/views.sql` when view columns change.

## Testing Guidelines
- No automated test suite yet (`npm test` is a placeholder). Validate by running the import scripts and checking the demo endpoint `/api/cities` (backed by `v_tangping_cities`).

## Commit & Pull Request Guidelines
- This workspace does not include a `.git` history; use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- PRs: describe data/DB impact, include the exact commands used to reproduce, and add screenshots/GIFs for `demo/` UI changes.
- Be mindful of large files in `data/` (CSV/SQLite); avoid committing regenerated blobs unless intentional.
