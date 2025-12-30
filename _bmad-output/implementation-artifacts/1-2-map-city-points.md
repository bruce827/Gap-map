# Story 1.2: 地图点位渲染 + 点击打开详情容器（MVP）

Status: done

## Story

As a 用户,
I want 在地图上看到城市点位，并能点击点位打开详情容器,
so that 我可以快速浏览城市分维度信息并进入后续对比/筛选流程。

## Acceptance Criteria

1. 地图页面可正常加载（主线：SvelteKit `(app)` 路由页面可用；demo 仅作为参考实现）。
2. 城市点位渲染：
   - 从 `GET /api/cities` 拉取城市列表；
   - 至少渲染 10 个有效经纬度的城市点位（`lng/lat` 均为有效数值）。
3. 点击交互：点击任意城市点位后，必须满足下列之一：
   - 打开 InfoWindow，至少显示城市名称；或
   - 打开详情 Modal/侧栏容器，至少显示城市名称。
4. 健壮性：
   - 当 AMap 脚本加载失败、接口返回错误、或城市列表为空时，页面不崩溃，并给出可见提示（`loading` 文案或 alert 均可）。
5. MVP 口径约束：
   - 不新增天气/新闻等动态数据展示与调用（Phase 2 Backlog）。
   - 不触发任何天气相关调用（例如 `AMap.Weather()` / `weather.getForecast(...)`）。
   - 不将 `rank` 解释为“综合排名/综合躺平指数排名”。（若保留显示，仅作为数据源字段/排序序号理解。）

## Scope / Non-goals

- 本 Story 可参考现有 demo 的 AMap Marker 方案（`demo/index.html`），但主线实现以根目录 SvelteKit 工程为准。
- AntV L7 的点图层/动画效果属于增强项；若引入导致改动面扩大，可延后到后续 Story/Phase。

## Tasks / Subtasks

- [x] Task 1：确认地图 Key 配置可用（AC: 1, 4）
  - [x] 主线：通过 SvelteKit API `GET /api/config` 获取 `amapKey` / `amapSecurityCode`
  - [x] `GET /api/config` 建议由 `src/routes/api/config/+server.ts` 实现，仅从服务端环境变量读取并返回（避免在前端代码里硬编码 key）
  - [x] AMap JS API 2.0 脚本加载成功（失败时提示用户检查根目录 `.env`）

- [x] Task 2：城市列表拉取与点位渲染（AC: 2, 4）
  - [x] 调用 `GET /api/cities` 并校验返回为数组
  - [x] 过滤无效经纬度城市（建议 `Number.isFinite(Number(city.lat)) && Number.isFinite(Number(city.lng))`）
  - [x] 为每个城市创建 Marker（或 L7 PointLayer，若你走 SvelteKit/L7 路线）

- [x] Task 3：点击打开详情容器（AC: 3）
  - [x] click 事件绑定到 marker
  - [x] 至少展示：城市名（可附省份/房价/舒适天数等静态字段）

- [x] Task 4：移除/禁用动态数据调用（AC: 5）
  - [x] 不新增天气/新闻请求
  - [x] 若沿用 demo 现有实现，移除/禁用 `AMap.Weather()` 与 `weather.getForecast(...)` 相关调用（避免与“动态数据 Phase 2”口径冲突）
  - [x] 自测时确认浏览器 Network 中无天气相关请求

- [x] Task 5：最小自测记录（AC: 1-4）
  - [x] 截图：地图加载 + 点位渲染
  - [x] 截图：点击点位打开详情容器

## Dev Notes

### Prefer reuse, avoid reinvention

- demo 已具备完整的“地图加载 + 点位渲染 + 点击详情 + Modal”骨架：
  - `demo/index.html`
    - `init()`：从 `/api/config` 拉取 Key 并动态加载 AMap 脚本
    - `loadMap()`：初始化地图、拉取 `/api/cities`、创建 Marker、绑定 click
    - `window.showDetails()`：打开详情 Modal（使用 `city.raw` 展示更多字段）

### Dynamic data guardrail

- 当前 demo 里 click 后会调用 `AMap.Weather().getForecast(...)` 渲染“今日气温”。
- 本 Story 的 MVP 口径要求是 **不做动态数据**：
  - 允许保留静态字段（房价/舒适天数/绿化率等来自 DB 的字段）；
  - 天气/新闻展示与接口在 Phase 2 再做。

### UI/UX scope (MVP)

- 详情容器的最低要求是：能看到城市名称。
- 其它字段（房价、舒适天数、绿化率）为加分项，不作为必须。

### Commands

- 启动 SvelteKit：`pnpm dev`
- 访问页面：`http://127.0.0.1:5173/`

### References

- [Source: demo/index.html]
- [Source: demo/server.js]
- [Source: docs/prd/prd-product.md#3.1.5 MVP范围与验收标准]
- [Source: docs/prd/prd-map-visual.md#📌 核心代码示例]

## Dev Agent Record

### Agent Model Used

Cascade

### Debug Log References

- `npm test`

### Completion Notes List

- ✅ 完成 Task 1：新增 `GET /api/config`（仅读取服务端环境变量），并新增集成测试 `tests/api-config.test.js` 验证返回 `amapKey/amapSecurityCode`。
- ✅ 完成 Task 2：地图页拉取 `/api/cities` 并过滤无效经纬度后创建 Marker；新增纯函数测试覆盖数据过滤、Marker 构造与 AMap 脚本 URL（默认不包含 Weather 插件）。
- ✅ 完成 Task 3：marker 点击后在页面展示“已选择城市”容器并显示城市名。
- ✅ 完成 Task 4：新增静态扫描测试，确保 `src/` 中不存在 `AMap.Weather` / `getForecast` 动态天气调用。
- ✅ 完成 Task 5：截图已保存到 `static/screenshots/`。

### File List

- src/routes/(app)/+page.svelte (primary)
- src/lib/amap-loader.js
- src/lib/amap.js
- src/lib/cities.js
- src/routes/api/config/+server.ts (config API; 本 Story 若需要才实现)
- src/routes/api/cities/+server.ts (cities API)
- tests/api-config.test.js
- tests/amap-loader.test.js
- tests/amap-lib.test.js
- tests/cities-lib.test.js
- tests/no-dynamic-data.test.js
- static/screenshots/screencapture-localhost-5173-2025-12-30-16_31_49.png
- static/screenshots/screencapture-localhost-5173-2025-12-30-16_36_00.png
- .gitignore
- demo/index.html (reference)
- demo/server.js (reference)
- docs/prd/prd-product.md
- docs/prd/prd-map-visual.md

### Change Log

- 2025-12-30: Task 1 完成（新增 `/api/config` + 集成测试）
- 2025-12-30: Task 2 完成（城市拉取/过滤/Marker 渲染 + 单测）
- 2025-12-30: Task 3/4 完成（marker 点击详情容器 + 禁用动态数据测试兜底）
- 2025-12-30: Task 5 完成（最小自测截图）
- 2025-12-30: Senior Developer Review (AI) - fixed HIGH+MED issues and marked done

## Senior Developer Review (AI)

- Reviewer: bruce on 2025-12-30
- Outcome: Changes Applied
- Fixed:
  - HIGH: `/api/config` missing-key now returns `500` + readable error; added negative test.
  - HIGH: `.svelte-kit/` added to `.gitignore` to avoid generated-file churn.
  - MED: show visible warning when valid city points < 10.
  - MED: avoid silent click failure by throwing when `marker.on` is missing while click handler is required; added negative test.
