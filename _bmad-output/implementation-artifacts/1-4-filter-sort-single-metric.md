# Story 1.4: 筛选与排序（单指标，MVP）

Status: review

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

- [x] Task 1：确认字段可用性与缺失值策略（AC: 3, 4）
  - [x] 从 `/api/cities` 返回对象确认可用于筛选/排序的字段（如 `price`, `comfort_days`, `province`, `green_rate`）
  - [x] 定义缺失值处理规则（例如：`price` 缺失视为不可比较，排序时放末尾；筛选时视为不通过）

- [x] Task 2：增加筛选 UI（至少 3 项）（AC: 1）
  - [x] 在地图页面增加轻量筛选面板（浮层/侧栏均可）
  - [x] 支持用户修改筛选条件并立即生效

- [x] Task 3：实现前端筛选逻辑（AC: 1, 3, 4）
  - [x] 基于全量 `allCitiesData`（或等价状态）得到 `filteredCities`
  - [x] 地图 marker 根据 `filteredCities` 显示/隐藏或重新渲染
  - [x] 空态：`filteredCities.length === 0` 时有明确提示（不崩溃）

- [x] Task 4：增加排序 UI（至少 2 个单指标）（AC: 2）
  - [x] 增加排序字段选择（如 price / comfort_days）
  - [x] 明确排序方向（升/降）

- [x] Task 5：实现排序结果可感知（AC: 2）
  - [x] 方案 A（推荐）：增加“结果列表（Top N）”，按排序展示城市名与指标值
  - [ ] 方案 B：在地图上对 Top N marker 使用不同样式（不依赖综合分）

- [x] Task 6：口径守护（AC: 5）
  - [x] 不把 `rank` 作为综合排名能力对外承诺（若页面已有 `rank` 展示，按“数据源字段/顺序号”理解）
  - [x] 不新增任何天气/新闻调用

- [x] Task 7：最小自测记录（AC: 1-4）
  - [x] 截图：筛选面板 + 筛选后 marker 数量明显变化
  - [x] 截图：排序后结果列表顺序变化
  - [x] 记录 1 组可复现样例（例如：`price < X` 且 `comfort_days > Y`）

## Dev Notes

### 当前架构基线
- 主线实现以 SvelteKit 工程为准（`src/` 目录）
- 城市数据通过 `citiesAPI().list()` 获取，返回 `City[]` 类型
- 地图 marker 通过 `createCityMarkers()` 创建，返回 marker 数组
- **当前问题**：`+page.svelte` 未保存 cities 数据和 markers 引用，需要修改以支持筛选

### 数据源与类型
- **API 端点**：`GET /api/cities`（`src/routes/api/cities/+server.ts`）
- **类型定义**：`City` 接口（`src/lib/types/index.ts`）
- **可用字段**：
  - `id`: string - 城市代码
  - `name`: string - 城市名称
  - `province`: string | null - 省份
  - `district`: string | null - 区县
  - `price`: number | null - 房价（元/㎡）
  - `comfort_days`: number | null - 舒适天数
  - `green_rate`: number | null - 绿化率（%）
  - `lat`, `lng`: number | null - 经纬度

### 缺失值处理策略
- **筛选时**：缺失值视为「不通过」，不显示在结果中
- **排序时**：缺失值放到末尾（升序时视为 Infinity，降序时视为 -Infinity）

### MVP 口径约束
- 不提供「综合总分/综合排名/躺平指数」
- 不引入天气/新闻等动态数据
- 筛选/排序在前端本地执行（全量数据已加载）

### 实现方案
1. **筛选面板**：创建 `FilterPanel.svelte` 组件，浮动在地图左侧
2. **状态管理**：在 `+page.svelte` 中维护 `allCities`、`filteredCities`、`markers` 状态
3. **marker 控制**：通过 `marker.show()` / `marker.hide()` 控制显示
4. **结果列表**：可选，在筛选面板下方显示 Top N 城市

### Commands

- 启动开发服务器：`npm run dev`
- 类型检查：`npm run check`
- 访问页面：`http://localhost:5173/`

### References

- `src/lib/types/index.ts` - City 类型定义
- `src/routes/api/cities/+server.ts` - 城市列表 API
- `src/lib/amap.js` - createCityMarkers 函数
- `src/routes/(app)/+page.svelte` - 主页面

## Dev Agent Record

### Agent Model Used

Cascade

### Debug Log References

### Completion Notes List

### File List

需创建：
- `src/lib/components/FilterPanel.svelte` - 筛选/排序面板组件

需修改：
- `src/routes/(app)/+page.svelte` - 集成筛选逻辑，保存 cities 和 markers 状态
- `src/lib/components/README.md` - 更新组件文档

已存在（无需修改）：
- `src/lib/types/index.ts` - City 类型定义
- `src/routes/api/cities/+server.ts` - 城市列表 API
- `src/lib/api/cities.ts` - API 客户端
- `src/lib/amap.js` - marker 创建函数
