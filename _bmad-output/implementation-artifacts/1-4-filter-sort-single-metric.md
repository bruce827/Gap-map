# Story 1.4: 筛选与排序（单指标，MVP）

Status: ready-for-dev

## Story

As a 用户,
I want 按条件筛选城市并按单一指标排序,
so that 我可以更快缩小候选城市范围，并用可解释的单指标进行比较。

## Acceptance Criteria

1. 筛选能力可用（至少 3 个条件）：
   - 至少实现 3 个可操作的筛选条件（可根据现有数据字段选择），并且能影响“地图上显示的城市集合”（隐藏/显示 marker 或仅渲染筛选后数据）。
2. 排序能力可用（至少 2 个单指标）：
   - 至少实现 2 个“单指标排序”（升序/降序任一方向明确），并且排序结果可被用户感知（例如：结果列表顺序变化、或在 UI 中展示 Top N）。
3. 结果正确：
   - 对同一份城市数据，筛选与排序的结果与规则一致（无随机/不稳定行为）。
4. 健壮性：
   - 某个字段缺失/为空不会导致筛选或排序崩溃；缺失值按约定处理（例如：当作 `Infinity` / `-Infinity` / 或直接排到末尾）。
5. MVP 口径约束：
   - 不提供“综合总分/综合排名”，不出现“综合躺平指数”相关 UI/文案。
   - 不引入天气/新闻等动态数据展示与调用（Phase 2 Backlog）。

## Scope / Non-goals

- 本 Story 默认走“前端本地筛选/排序”路线：从 `GET /api/cities` 拉到全量（小样本）后在前端处理。
- 不要求引入 ECharts/Chart.js 图表。
- 不要求做复杂查询语法（例如多条件组合表达式）；满足 MVP 最小可用即可。

## Suggested Filter / Sort Set (MVP 推荐)

为降低返工风险，建议优先使用 demo 已有的稳定字段：

- **筛选（至少 3 个）**
  - `price`：房价上限/区间
  - `comfort_days`：舒适天数下限
  - `province`：省份下拉（或按“沿海/内陆”这种基于省份映射的布尔筛选）
  - 可选：`green_rate`：绿化率下限

- **排序（至少 2 个）**
  - 按 `price` 排序（从低到高 / 或从高到低）
  - 按 `comfort_days` 排序（从高到低 / 或从低到高）

## Tasks / Subtasks

- [ ] Task 1：确认字段可用性与缺失值策略（AC: 3, 4）
  - [ ] 从 `/api/cities` 返回对象确认可用于筛选/排序的字段（如 `price`, `comfort_days`, `province`, `green_rate`）
  - [ ] 定义缺失值处理规则（例如：`price` 缺失视为不可比较，排序时放末尾；筛选时视为不通过）

- [ ] Task 2：增加筛选 UI（至少 3 项）（AC: 1）
  - [ ] 在地图页面增加轻量筛选面板（浮层/侧栏均可）
  - [ ] 支持用户修改筛选条件并立即生效

- [ ] Task 3：实现前端筛选逻辑（AC: 1, 3, 4）
  - [ ] 基于全量 `allCitiesData`（或等价状态）得到 `filteredCities`
  - [ ] 地图 marker 根据 `filteredCities` 显示/隐藏或重新渲染
  - [ ] 空态：`filteredCities.length === 0` 时有明确提示（不崩溃）

- [ ] Task 4：增加排序 UI（至少 2 个单指标）（AC: 2）
  - [ ] 增加排序字段选择（如 price / comfort_days）
  - [ ] 明确排序方向（升/降）

- [ ] Task 5：实现排序结果可感知（AC: 2）
  - [ ] 方案 A（推荐）：增加“结果列表（Top N）”，按排序展示城市名与指标值
  - [ ] 方案 B：在地图上对 Top N marker 使用不同样式（不依赖综合分）

- [ ] Task 6：口径守护（AC: 5）
  - [ ] 不把 `rank` 作为综合排名能力对外承诺（若页面已有 `rank` 展示，按“数据源字段/顺序号”理解）
  - [ ] 不新增任何天气/新闻调用

- [ ] Task 7：最小自测记录（AC: 1-4）
  - [ ] 截图：筛选面板 + 筛选后 marker 数量明显变化
  - [ ] 截图：排序后结果列表顺序变化
  - [ ] 记录 1 组可复现样例（例如：`price < X` 且 `comfort_days > Y`）

## Dev Notes

### Existing demo baseline
- 主线实现以根目录 SvelteKit 工程为准；demo 的实现仅作为参考。
- `demo/index.html` 当前会把 `/api/cities` 结果存到全局 `allCitiesData`，并逐条创建 marker。
- demo 未提供筛选/排序 UI 与逻辑；这是本 Story 需要补齐的部分。

### Data source
- `/api/cities`（主线：SvelteKit API）返回字段包括：
  - `name`, `province`, `rank`, `lat`, `lng`, `district`, `price`, `comfort_days`, `green_rate`, `raw`

### MVP scope alignment
- `docs/prd/prd-product.md` 明确：
  - MVP 支持筛选（至少 3 条件）与排序（至少 2 个单指标）
  - MVP 不提供综合总分/综合排名
  - 动态数据（天气/新闻）属于 Phase 2

### Commands

- 启动 SvelteKit：`pnpm dev`
- 访问页面：`http://127.0.0.1:5173/`

### References

- [Source: demo/index.html]
- [Source: demo/server.js#/api/cities]
- [Source: docs/prd/prd-product.md#3.1.5 MVP范围与验收标准]
- [Source: docs/prd/prd-product.md#3.2.2 辅助功能#功能7: 数据筛选与排序]

## Dev Agent Record

### Agent Model Used

Cascade

### Debug Log References

### Completion Notes List

### File List

- src/routes/(app)/+page.svelte
- src/routes/api/cities/+server.ts
- demo/index.html (reference)
- demo/server.js (reference)
- docs/prd/prd-product.md
