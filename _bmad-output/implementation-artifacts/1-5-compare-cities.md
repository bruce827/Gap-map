# Story 1.5: 城市对比（2-4 城，分维度对比，无综合总分）（MVP）

Status: ready-for-dev

## Story

As a 用户,
I want 选择 2-4 个城市并对比它们的分维度指标,
so that 我可以更直观地做取舍，而不是依赖单一指标或“综合排名”。

## Acceptance Criteria

1. 可选择城市进入对比：
   - 用户可将城市加入“对比列表”。
   - 最少选择 2 城才可进入对比；最多 4 城（超出时给出提示）。
2. 对比视图可用：
   - 有一个对比容器（Modal/侧栏/独立面板均可）展示所选城市。
3. 分维度对比清晰（至少 5 个维度）：
   - 至少展示 5 个维度字段，并在所有被选城市之间横向对齐。
   - 推荐维度优先使用现有静态数据字段（例如 `price`, `comfort_days`, `green_rate` 等），不足时从 `city.raw` 精选补足。
4. 空值兜底：
   - 任一城市缺少某维度字段时，对比表格仍能正常渲染；缺失值显示为 `'-'` / `'暂无'`。
5. MVP 口径约束：
   - 不展示“综合总分/综合排名/综合躺平指数”。
   - 不把 `rank` 解释为综合排名能力（若出现，仅按数据源字段/顺序号理解）。
   - 不引入天气/新闻等动态数据展示与调用（Phase 2 Backlog）。

## Scope / Non-goals

- 本 Story 优先实现“表格对比”（最小可交付）。
- 雷达图/柱状图属于增强项（可留到后续迭代或在不扩大改动面的前提下实现）。
- 不要求做账号体系；对比列表可临时保存在内存或 LocalStorage（可选）。

## Suggested Dimension Set (MVP 推荐)

为降低返工风险，优先使用 `/api/cities`（主线：SvelteKit API）已有字段：

- **基础信息**
  - 城市名（`name`）
  - 省份/区县（`province`/`district`）

- **维度字段（至少 5 个，建议 5-8 个）**
  - 房价（`price`）
  - 舒适天数（`comfort_days`）
  - 绿化率（`green_rate`）
  - 从 `city.raw` 精选 2-5 个稳定字段（按现有数据情况确定）

> 注意：`rank` 不属于“维度指标”，且不能被解释为综合排名能力。

## Tasks / Subtasks

- [ ] Task 1：确定对比入口与交互（AC: 1, 2）
  - [ ] 方案 A（推荐，改动小）：在详情容器中加入“加入对比”按钮
  - [ ] 方案 B：在地图 marker / infoWindow 中加入“加入对比”按钮
  - [ ] 展示当前已选城市数量（0-4）

- [ ] Task 2：实现对比列表状态管理（AC: 1）
  - [ ] 维护 `compareCities`（数组），元素包含最小信息：`name` + 维度字段
  - [ ] 限制最多 4 城；超过时提示并拒绝加入
  - [ ] 支持移除已选城市

- [ ] Task 3：实现对比视图（表格优先）（AC: 2, 3, 4）
  - [ ] 展示为二维表：行=维度，列=城市
  - [ ] 维度 label 友好化（中文）
  - [ ] 缺失字段显示 `'-'`

- [ ] Task 4：字段映射与标准化（AC: 3, 4）
  - [ ] 明确字段来源：
    - 优先取 `/api/cities` 顶层字段（`price`, `comfort_days`, `green_rate`）
    - 补充字段来自 `city.raw`（中文 key）
  - [ ] 数值格式化策略（例如房价单位）保持一致，不做强制换算为“综合分”

- [ ] Task 5：口径守护（AC: 5）
  - [ ] 对比 UI 不出现“综合评分/综合排名/躺平指数”文案
  - [ ] 不新增天气/新闻调用

- [ ] Task 6：最小自测记录（AC: 1-5）
  - [ ] 截图：加入 2 城并打开对比
  - [ ] 截图：加入第 5 城时被拦截（最多 4 城）
  - [ ] 截图：某字段缺失时仍可对比

## Dev Notes

### PRD alignment

- `docs/prd/prd-product.md` 功能 5 明确：对比 2-4 城、多维度对比；MVP 不提供综合总分/排名。

### Data source

- `/api/cities`（主线：SvelteKit API）返回字段包含：
  - `name`, `province`, `rank`, `lat`, `lng`, `district`, `price`, `comfort_days`, `green_rate`, `raw`

### Minimal implementation approach (SvelteKit)

- 主线实现以根目录 SvelteKit 工程为准：
  - 在详情容器中加入“加入对比”按钮
  - 用组件内状态或 store 维护 `compareCities`
  - 用一个简单 Modal/侧栏渲染对比表格
- 可参考 demo 的全局变量与 Modal 结构（`allCitiesData` / `window.showDetails`），但不作为主线实现入口。

### Commands

- 启动 SvelteKit：`pnpm dev`
- 访问页面：`http://127.0.0.1:5173/`

### References

- [Source: docs/prd/prd-product.md#3.2.1 核心功能#功能5: 城市对比功能]
- [Source: docs/prd/prd-product.md#3.1.5 MVP范围与验收标准]
- [Source: demo/server.js#/api/cities]
- [Source: demo/index.html]

## Dev Agent Record

### Agent Model Used

Cascade

### Debug Log References

### Completion Notes List

### File List

- src/routes/(app)/+page.svelte
- src/routes/(app)/city/[id]/+page.svelte
- src/routes/api/cities/+server.ts
- demo/index.html (reference)
- demo/server.js (reference)
- docs/prd/prd-product.md
