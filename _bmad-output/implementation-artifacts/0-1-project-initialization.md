# Story 0.1: 项目初始化（SvelteKit 主应用 + Prisma 数据层 + Admin 路由骨架）（MVP/Phase 2 前置）

Status: review

## Story

As a 开发者,
I want 在仓库内按 PRD 技术架构完成主应用工程初始化（SvelteKit 全栈）并打通 Prisma/SQLite 的本地开发链路，同时预置 `/admin` 的路由骨架,
so that 后续 1-x（地图/详情/筛选/对比）与 2-x（管理端/任务）可以在同一工程内按 Story 逐步实现，而不依赖 demo 原型作为主线。

## Acceptance Criteria

1. SvelteKit 工程可用：仓库内存在可运行的 SvelteKit 项目（本地可启动、可访问页面）。
2. UI 基础可用：TailwindCSS + Flowbite Svelte（按 PRD 技术栈）安装并可在页面中渲染示例组件。
3. 数据层可用：Prisma + SQLite 本地开发链路可用：
   - `.env` 中 `DATABASE_URL="file:./data/gapmap.db"` 生效
   - Prisma client 可连接并查询（最小验证即可）
4. API Routes 骨架可用：
   - 存在 SvelteKit API 路由目录结构（例如 `src/routes/api/...`）
   - 至少提供一个“健康检查”接口（用于后续 Story 复用）
   - 预置 `/api/cities` 路由骨架位置（本 Story 只返回明确占位响应，例如 `501 Not Implemented`；具体查询逻辑留给后续 Story）
5. Admin（A1 同项目）骨架可用：
   - 预置 `/admin` 路由组（页面可打开），但不要求在本 Story 完成 CRUD 功能
   - 预置 `/admin` 的 layout 壳（后续挂鉴权/导航）与 `/admin/cities` 子路由骨架位置
   - 预留鉴权中间件/门禁位置（具体实现放到 `2-1-admin-city-crud`）
6. 文档/命令可复现：在本 Story 的 Dev Notes 里写清：启动命令、环境变量、以及最小验证路径。

## Tasks / Subtasks

- [x] Task 1：明确工程边界（A1：Admin 与主应用同一 SvelteKit 项目）（AC: 1, 5）
  - [x] 确认本仓库只维护一个主 SvelteKit 工程（Web UI + API + /admin）
  - [x] 明确 demo 目录仅作为原型，不作为后续 Story 的实现主线

- [x] Task 2：初始化 SvelteKit 项目骨架（AC: 1）
  - [x] 使用 `npm create svelte@latest` 初始化（TypeScript 模板）
  - [x] 选择适配器（本地开发优先，生产按 PRD 再决策）
  - [x] 确保 `npm run dev` 可启动并能访问首页

- [x] Task 3：接入 TailwindCSS + UI 组件库（AC: 2）
  - [x] 安装并配置 TailwindCSS
  - [x] 安装并配置 UI 组件库：Flowbite Svelte
  - [x] 在首页渲染一个 UI 组件，确认样式生效

- [x] Task 4：打通 Prisma + SQLite（AC: 3）
  - [x] 根目录创建/更新 `.env`：`DATABASE_URL="file:./data/gapmap.db"`
  - [x] `npx prisma generate`
  - [x] 最小验证：用 Prisma client 进行一次只读查询（例如 City/TangpingCity 任意一张表）

- [x] Task 5：预置 SvelteKit API Routes 结构（AC: 4）
  - [x] 创建 `src/routes/api/health/+server.ts`（或等价）返回版本/时间戳
  - [x] 预置 `src/routes/api/cities/+server.ts`（本 Story 仅返回明确占位响应，例如 `501 Not Implemented` + JSON `{ error: 'not_implemented' }`；具体实现放到后续 Story）
  - [x] 预置 `src/routes/api/cities/[id]/+server.ts`（本 Story 仅占位；具体实现放到后续 Story）

- [x] Task 6：预置 `/admin` 路由骨架（AC: 5）
  - [x] 创建 `src/routes/admin/+layout.svelte`（管理端壳，预留鉴权与导航位置）
  - [x] 创建 `src/routes/admin/+page.svelte`（或等价）
  - [x] 预置 `src/routes/admin/cities/+page.svelte`（城市列表占位）
  - [x] 页面显示“Admin Placeholder”并提示后续接入鉴权（具体实现放到 `2-1-admin-city-crud`）

- [x] Task 7：对齐 PRD 的目录骨架（占位即可）（AC: 1-6）
  - [x] 预置 `src/routes/(app)/+page.svelte`（主地图页占位）
  - [x] 预置 `src/routes/(app)/city/[id]/+page.svelte`（城市详情页占位）
  - [x] 建立 `scrapers/` 目录占位（Phase 2+，不要求实现爬虫逻辑）
  - [x] 建立 `static/screenshots/` 目录占位（给爬虫截图/日志预留）
  - [x] 建立 `tests/` 目录占位（单测/集成测试）

- [x] Task 8：最小自测记录（AC: 1-6）
  - [x] 记录：启动命令 + health 接口返回样例 + admin 页面截图

## Dev Notes

### Why this story exists

- 现有 Story 1-x 大量引用 demo 作为验证入口，但 PRD 技术架构主线是 SvelteKit 全栈。
- 本 Story 用于补齐“工程初始化”缺口，避免后续实现时无处落代码。

### Suggested repo layout (A1)

- Web UI + API + Admin：同一 SvelteKit 项目（仓库根目录 `src/`），并按 PRD 建议的路由组织：
  - `src/routes/(app)/+page.svelte`：主地图页
  - `src/routes/(app)/city/[id]/+page.svelte`：城市详情
  - `src/routes/admin/*`：管理端（A1 同项目）
  - `src/routes/api/*`：API routes
- 数据导入/清洗脚本：继续使用现有 `scripts/`
- Prisma：继续使用现有 `prisma/`
- `data/gapmap.db`：继续作为本地开发默认 DB
- Phase 2+ 预留：`scrapers/`（爬虫与定时任务）、`static/screenshots/`（截图存储）、`tests/`

### References

- [Source: docs/product_brief.md#核心技术栈]
- [Source: docs/prd/prd-index.md#三、开发环境搭建]
- [Source: docs/prd/prd-technical.md#2.3 项目结构建议]
- [Source: prisma/schema.prisma]

## Dev Agent Record

### Agent Model Used

Cascade

### Commands

- `pnpm install`
- `pnpm prepare`
- `pnpm test`
- `pnpm check`
- `pnpm exec prisma generate`
- `pnpm dev`

### Minimal Verification

- `GET http://127.0.0.1:5173/` 首页可打开，Flowbite Svelte 按钮渲染正常
- `GET http://127.0.0.1:5173/admin` 管理端占位页可打开
- `GET http://127.0.0.1:5173/admin/cities` 管理端子路由占位页可打开
- `GET http://127.0.0.1:5173/api/health` 返回 `{"ok":true,"ts":"...","dbOk":true,"cityCount":...}`
- `GET http://127.0.0.1:5173/api/cities` 返回 `501` 与 `{"error":"not_implemented"}`

### Files Changed / Added

- `package.json`
- `pnpm-lock.yaml`
- `svelte.config.js`
- `vite.config.ts`
- `tsconfig.json`
- `postcss.config.cjs`
- `tailwind.config.cjs`
- `src/app.html`
- `src/app.css`
- `src/lib/server/prisma.ts`
- `src/routes/+layout.svelte`
- `src/routes/(app)/+page.svelte`
- `src/routes/(app)/city/[id]/+page.svelte`
- `src/routes/admin/+layout.svelte`
- `src/routes/admin/+page.svelte`
- `src/routes/admin/cities/+page.svelte`
- `src/routes/api/health/+server.ts`
- `src/routes/api/cities/+server.ts`
- `src/routes/api/cities/[id]/+server.ts`
- `scrapers/.gitkeep`
- `static/screenshots/.gitkeep`
- `tests/.gitkeep`
