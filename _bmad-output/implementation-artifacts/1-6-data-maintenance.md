# Story 1.6: 数据维护入口（脚本或后台 CRUD，MVP）

Status: ready-for-dev

## Story

As a 维护者/开发者,
I want 通过脚本或轻量管理入口新增/更新城市数据，并确保前台（主线：SvelteKit）能读取到最新数据,
so that 我可以低成本迭代数据质量与覆盖范围，保证 MVP 的数据可持续维护。

## Acceptance Criteria

1. 具备最小“写入/更新”能力：
   - 至少能对数据库中的某个城市完成一次可验证的“新增或更新”（例如更新某城市的 `CityHousing` / `CityClimate` 字段，或新增一条 `TangpingCity` 相关记录）。
2. 变更可被前台读取：
   - 数据更新后，重新访问主线的 `GET /api/cities` 能看到更新结果（字段值变化可见）。
3. 可追踪与可复现：
   - 数据更新路径有明确命令与输入文件（或明确的 Prisma 操作步骤），并能被复现。
4. 失败可定位：
   - 导入/更新失败时能看到错误信息（console log / Prisma error），并能定位到是哪条数据/哪个字段导致。
5. MVP 口径约束：
   - 本 Story 不引入天气/新闻等动态数据采集/存储（Phase 2 Backlog）。
   - 不新增“综合总分/综合排名”计算逻辑；`rank` 若存在，仅作为数据源字段。

## Scope / Non-goals

- MVP 默认走“脚本维护”路线（TypeScript + Prisma + SQLite），不强制实现完整后台 UI。
- 管理后台/鉴权/多用户权限管理属于后续迭代（非本 Story 必需）。
- 本 Story 不要求重做数据库 schema；优先复用现有表结构。

## Recommended Approach (MVP)

优先复用仓库已存在的脚本与命令：

- 行政区划导入：`npm run import:area`（`scripts/import-area.ts`，读取 `data/area_level3.csv`）
- 躺平城市数据导入：`npm run import`（`scripts/import-csv.ts`，读取 `data/cities_complete.csv`）
- 数据修复（可选）：`scripts/fix-data.ts`
- 视图重建：`npx prisma db execute --file prisma/views.sql`

并以主线的 `/api/cities`（SvelteKit API；读取视图 `v_tangping_cities`）作为验收出口。

### Golden Path（最短闭环，推荐按此验收）

1. 选定一个已在 `/api/cities` 中返回的城市（例如按 `name` 搜索到该城市）。
2. 通过“脚本写入”更新一个静态字段：
   - 推荐字段：房价（`CityHousing.avgSecondHandPriceNum`）或舒适天数（`CityClimate.comfortDays`）。
3. 重新访问 `http://127.0.0.1:5173/api/cities`，确认该城市字段值已变化。

> 说明：大部分情况下**不需要**重建视图即可看到新值；只有当你修改了 `prisma/views.sql`（视图定义/列/计算逻辑）时，才需要执行视图重建。

### When to rebuild views（何时需要执行 views.sql）

- **需要重建**：你改动了 `prisma/views.sql` 本身（新增列、改列名、改 join/计算逻辑）。
- **不需要重建**：你只是在表数据里新增/更新记录（例如重新跑 `npm run import` 或修复脚本更新某字段）。

## Tasks / Subtasks

- [ ] Task 1：确认环境与数据库写入链路（AC: 1, 3）
  - [ ] 根目录准备 `.env`，至少包含：`DATABASE_URL="file:./data/gapmap.db"`
  - [ ] 确认 Prisma 可连接数据库（可通过 `npx prisma studio` 或脚本运行验证）
  - [ ] 确认 Prisma 写入的 DB 与主线 SvelteKit 读取的 DB 是同一个文件：
    - 主线读取：`DATABASE_URL` 指向的 SQLite 文件（建议 `file:./data/gapmap.db`）
    - 避免“写到 A 库、读的是 B 库”的环境分裂

- [ ] Task 2：定义“最小可验证的变更样例”（AC: 1, 2）
  - [ ] 选定一个城市（已存在于 `v_tangping_cities` 中）
  - [ ] 选定一个字段做更新（推荐：`CityHousing.avgSecondHandPriceNum` / `CityClimate.comfortDays` / `CityClimate.greenCoverageRate`）

- [ ] Task 3：执行数据更新（脚本优先）（AC: 1, 4）
  - [ ] 路线 A（推荐）：复用导入脚本
    - [ ] 修改对应 CSV（例如 `data/cities_complete.csv`）中的一条记录并重新运行 `npm run import`
  - [ ] 路线 B：编写/复用修复脚本
    - [ ] 运行 `tsx scripts/fix-data.ts`（或新增一个极小的 `scripts/update-one-city.ts`，只更新一个字段）

- [ ] Task 4：重建/确认视图更新（AC: 2）
  - [ ] 仅当你改动了 `prisma/views.sql`（视图定义）时，才执行：`npx prisma db execute --file prisma/views.sql`
  - [ ] 解释：主线的 `/api/cities` 直接查询 `v_tangping_cities`；视图定义变更需要重建，纯数据更新不需要

- [ ] Task 5：验证前台读取到最新数据（AC: 2, 3）
  - [ ] 启动 SvelteKit 并访问 `http://127.0.0.1:5173/api/cities`
  - [ ] 确认被选城市的字段值已变化

- [ ] Task 6：记录可复现步骤（AC: 3, 4）
  - [ ] 在本 Story 的完成记录中，补充：
    - [ ] 修改了哪个输入文件/哪一行（或哪个脚本）
    - [ ] 执行了哪些命令
    - [ ] 如何验证成功

## Dev Notes

### Why scripts-first

- 当前仓库已经有完整的导入/清洗脚本体系（`scripts/`），且 `package.json` 已提供 `npm run import` / `npm run import:area`。
- 对 MVP 来说，脚本维护成本最低，也最贴近“数据更新后前台可读”的验收。

### Current data pipeline (authoritative)

- 写入：Prisma（TypeScript 脚本）→ `data/gapmap.db`
- 读出（主线）：SvelteKit API → Prisma/SQLite → `SELECT * FROM v_tangping_cities`
- 视图定义：`prisma/views.sql`

### Commands

- 导入行政区划：`npm run import:area`
- 导入城市数据：`npm run import`
- 打开 Prisma Studio：`npm run prisma:studio`
- 重建视图：`npx prisma db execute --file prisma/views.sql`
- 启动 SvelteKit：`pnpm dev`

### References

- [Source: package.json#scripts]
- [Source: scripts/import-csv.ts]
- [Source: scripts/import-area.ts]
- [Source: scripts/fix-data.ts]
- [Source: prisma/views.sql]
- [Source: demo/server.js#/api/cities]
- [Source: docs/prd/prd-product.md#3.1.5 MVP范围与验收标准]

## Dev Agent Record

### Agent Model Used

Cascade

### Debug Log References

### Completion Notes List

### File List

- scripts/import-csv.ts
- scripts/import-area.ts
- scripts/fix-data.ts
- prisma/views.sql
- demo/server.js
