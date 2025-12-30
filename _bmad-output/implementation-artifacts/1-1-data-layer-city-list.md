# Story 1.1: 数据层可用：城市列表查询可用（SQLite 视图 + /api/cities）

Status: done

## Story

As a 维护者/开发者,
I want 能稳定从 SQLite 数据库查询城市列表并通过一个 API/查询入口对外提供,
so that 支撑 MVP 的地图点位渲染与城市详情展示，并作为后续筛选/排序/对比的基础。

## Acceptance Criteria

1. 数据库中至少有 10 条城市数据可被查询到，且每条包含有效经纬度（`lng`/`lat`）。
2. 至少存在一个稳定的查询入口满足下列之一：
   - `demo/server.js` 的 `GET /api/cities` 正常返回 JSON 数组；或
   - Prisma 查询/其它服务端接口返回等价的城市列表。
3. 返回数据中至少包含字段：`name`、`lng`、`lat`（允许额外字段：`province`、`price`、`comfort_days` 等）。
4. 发生以下情况时系统不崩溃：
   - 视图不存在 / 数据库文件不存在（应给出明确错误信息或启动日志）；
   - 个别字段为空（应在映射时兜底为 `null`/缺省值）。
5. MVP 口径约束得到遵守：
   - 不引入天气/新闻等动态数据（Phase 2 Backlog）。
   - 不把任何字段作为“综合总分/综合排名”对外承诺（即使数据源里有 `rank`，也仅作为数据源排序/展示字段，MVP 不做综合排名能力）。
6. 若 `v_tangping_cities` 的排序依赖 `tc.rank`，则需确保：
   - `rank` 为空不会导致查询失败；
   - MVP 前端不应将 `rank` 解释为“综合排名”。

## Tasks / Subtasks

- [x] Task 1：确认 SQLite 数据库与视图可用（AC: 1, 2）
  - [x] 确认 `data/gapmap.db` 存在且可被读取
  - [x] 确认视图 `v_tangping_cities` 存在（必要时执行：`npx prisma db execute --file prisma/views.sql`）
  - [x] 用 sqlite3 直接验证视图可查且经纬度存在（示例：`sqlite3 -header -column data/gapmap.db "SELECT 城市, 经度, 纬度 FROM v_tangping_cities LIMIT 5;"`）

- [x] Task 2：确认 `GET /api/cities` 可返回最小字段集（AC: 2, 3）
  - [x] 启动主线 SvelteKit（`pnpm dev`）并访问 `http://127.0.0.1:5173/api/cities`
  - [x] 响应为 JSON array，且每条至少包含 `name/lng/lat`
  - [x] 采样检查：至少 10 条记录、且 `lng/lat` 为可解析数值（不是空字符串）

- [x] Task 3：健壮性与口径守护（AC: 4, 5）
  - [x] 处理字段缺失：例如 `row['二手房价格_元'] || row['套房价格_元']` 这类兜底保持不报错
  - [x] 明确 UI/文档层不把 `rank` 解释为“综合排名”（如需保留字段，按“数据源排名/数据源顺序”理解）
  - [x] 若需要对外隐藏 `rank`，优先在前端不展示；避免在数据层删除字段导致下游 breaking change

- [x] Task 4：最小自测记录（AC: 2, 4）
  - [x] 记录验证方式：`npm test` 输出 + `/api/cities` 响应样例（贴到卡片或 PR 描述）

## Dev Notes

### Existing Implementation (Prefer reuse, avoid reinvention)

- 主线 SvelteKit 已实现 `GET /api/cities`：
  - 路径：`src/routes/api/cities/+server.ts`
  - 数据源：Prisma/SQLite（读取视图 `v_tangping_cities`）
  - 查询：显式选择必要字段，并使用 SQL alias 输出英文 key（避免直接依赖中文列名）
  - 映射：返回最小字段集 `id/name/lng/lat`（可扩展 `province/price/comfort_days` 等）；默认不返回 `raw`

- demo 原型也有同等接口实现（`demo/server.js`），可作为对照，但不作为主线验收路径。

### Database / Views

- 视图定义：`prisma/views.sql`（包含 `v_tangping_cities`）
- Prisma 模型：`prisma/schema.prisma`
  - `TangpingCity.rank` 当前存在但可为空；MVP 不把它作为综合排名能力对外承诺。

### Commands

- 创建/更新视图：
  - `npx prisma db execute --file prisma/views.sql`
- 验证接口（主线 SvelteKit）：
  - `pnpm dev`（然后访问 `/api/cities`）

### Preconditions / Environment

- `npx prisma db execute` 依赖根目录 `.env` 中的 `DATABASE_URL`（示例：`DATABASE_URL="file:./data/gapmap.db"`）。
- demo 的 `/api/cities` 直接读取 `data/gapmap.db`，与 Prisma 的 `DATABASE_URL` 无直接耦合，但建议保持一致以避免环境分裂。

### Project Structure Notes

- 数据导入与清洗脚本在 `scripts/`（用 `tsx` 运行）
- Demo 服务在 `demo/`，作为原型对照，不作为主线开发/验收路径

### References

- [Source: demo/server.js]
- [Source: prisma/views.sql]
- [Source: prisma/schema.prisma]
- [Source: README.md#API 端点]
- [Source: docs/prd/prd-product.md#3.1.5 MVP范围与验收标准]

## Dev Agent Record

### Agent Model Used

Cascade

### Debug Log References

- `ls -l data/gapmap.db`
- `sqlite3 -header -column data/gapmap.db "SELECT 城市, 经度, 纬度 FROM v_tangping_cities LIMIT 5;"`
- `npm test`

### Completion Notes List

- ✅ 完成 Task 1：确认 `data/gapmap.db` 存在，且 `v_tangping_cities` 可查询并返回有效经纬度样例。
- ✅ 新增自动化校验：`tests/data-layer-city-list.test.js`（Node 内置 `node:test`）验证 `v_tangping_cities` 至少 10 条且经纬度为数值。
- ✅ 将根目录 `npm test` 配置为 `node --test`，并确认测试通过。
- ✅ 完成 Task 2：实现主线 SvelteKit `GET /api/cities`（读取 `v_tangping_cities`）并验证返回数组、>= 10 条、且 `name/lng/lat` 为可解析数值。
- ✅ 更新自动化校验：`tests/api-cities.test.js` 启动主线 dev server 并验证 `GET /api/cities` 的最小字段与数据质量；并覆盖 DB/view 缺失时返回 500（AC4）。

### File List

- src/routes/api/cities/+server.ts
- tests/data-layer-city-list.test.js
- tests/api-cities.test.js

## Senior Developer Review (AI)

- Reviewer: bruce on 2025-12-30
- 结论：Changes Applied（HIGH/MEDIUM 已修复）；Story 可标记为 done。
- 已修复：
  - `/api/cities` 不再默认返回 `raw`，避免 payload 过大
  - `/api/cities` 使用 SQL alias 输出英文 key，降低对中文列名的隐式耦合
  - 补充 AC4 负向覆盖：DB/view 缺失时返回 500 且 error 可读
  - 修正 Task 4 的验收路径（不再依赖 demo）

## Change Log

- 2025-12-30: CR auto-fix（API payload/alias + tests + story sync）
