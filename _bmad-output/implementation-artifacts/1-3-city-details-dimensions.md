# Story 1.3: 城市详情（分维度指标展示，无综合总分/排名）（MVP）

Status: ready-for-dev

## Story

As a 用户,
I want 在点击城市点位后查看该城市的基础信息与分维度指标（带清晰字段名与空值兜底）,
so that 我可以基于多个维度做初步判断，并为后续筛选/对比做准备。

## Acceptance Criteria

1. 详情容器可用：在地图点位点击后，能打开一个详情容器（Modal/侧栏/卡片均可）。
2. 详情内容最小集：详情容器至少显示：
   - 城市名称（必选）
   - 至少 5 个“分维度字段”（来自静态数据源/DB 视图），例如：房价/租金、医疗资源、交通可达性、生活成本、气候/舒适天数等（字段可因数据源不同而调整）。

3. 空值/缺字段兜底：
   - 缺失/空字符串/null 的字段显示为“暂无/未知/-”，页面不报错。

4. MVP 口径约束：
   - 不展示“综合总分/综合排名/综合躺平指数”。
   - 不引入天气/新闻等动态数据展示与调用（Phase 2 Backlog）。

5. 数据来源可追溯（MVP 最小要求）：
   - 若展示了某字段，开发者能在代码里定位该字段来自 `GET /api/cities` 返回对象的哪个 key（或 `city.raw` 的哪个中文字段）。

## Tasks / Subtasks

- [ ] Task 1：确认详情容器的实现形态与触发路径（AC: 1）
  - [ ] 主线：在根目录 SvelteKit 前端实现同等能力的详情容器（Modal/侧栏/卡片）
  - [ ] 可参考 demo：`demo/index.html` 的 `window.showDetails(index)` Modal（仅参考，不作为主线实现入口）
  - [ ] 点击地图点位后，确保能稳定触发打开详情

- [ ] Task 2：确定“分维度字段清单”（至少 5 项）（AC: 2, 5）
  - [ ] 从 `/api/cities` 的顶层字段优先取值：
    - `price`（房价）
    - `comfort_days`（舒适天数）
    - `green_rate`（绿化率）
    - 可选：`province`/`district`
  - [ ] 若顶层字段不足，可从 `city.raw`（中文字段）中挑选 2-3 个稳定字段补足
  - [ ] **不要**把 `rank` 解释为“综合排名”（若保留展示，仅作为数据源字段/顺序号理解）

- [ ] Task 3：字段映射与展示（AC: 2, 5）
  - [ ] 为展示字段提供“用户可读”的 label（中文）
  - [ ] 数值格式化：
    - [ ] 金额单位（元/万元）按现有数据源保持一致，不强行换算
    - [ ] 百分比字段（如绿化率）补齐 `%`（若数据源本身为数值）

- [ ] Task 4：空值与异常兜底（AC: 3, 4）
  - [ ] 缺失字段显示 `'-'` / `'暂无'`
  - [ ] 当 `city.raw` 不存在或结构异常时，详情仍至少显示城市名，并给出“暂无更多信息”

- [ ] Task 5：口径守护（AC: 4）
  - [ ] 不新增任何天气/新闻调用（例如 `AMap.Weather()`）
  - [ ] 详情 UI 文案中不出现“综合评分/综合排名/躺平指数”

- [ ] Task 6：最小自测记录（AC: 1-4）
  - [ ] 截图：打开详情容器
  - [ ] 截图：展示 >= 5 个字段
  - [ ] 截图：某字段缺失时的兜底展示

## Dev Notes

### Source of truth

- 主线实现以根目录 SvelteKit 工程为准；demo 的详情实现仅作为字段挑选与展示策略参考。
- demo 的详情能力已经存在：`demo/index.html` 的 `window.showDetails(index)`
  - 它会遍历 `city.raw` 的 key/value 并渲染到 Modal。
  - 这会导致字段数量非常多且不够“分维度”，MVP 建议做一次“字段精选”，只展示 5-10 个核心字段。

### MVP scope alignment

- `docs/prd/prd-product.md` 明确：
  - MVP **点击点位可打开详情并展示关键分维度字段**
  - MVP **不做** 动态数据（天气/新闻）
  - MVP **不做** 综合躺平指数/排名

### Suggested implementation approach (minimal change)

- 在 demo 方案下，你可以：
  - 保留 Modal 结构与打开方式
  - 将 `Object.keys(raw).forEach(...)` 改为“白名单字段数组 + 显示顺序”，并在 label 层做友好化

### Commands

- 启动 SvelteKit：`pnpm dev`
- 访问页面：`http://127.0.0.1:5173/`

### References

- [Source: demo/index.html#window.showDetails]
- [Source: demo/server.js#/api/cities]
- [Source: docs/prd/prd-product.md#3.1.5 MVP范围与验收标准]
- [Source: docs/prd/prd-product.md#3.2.1 核心功能#功能2: 城市基础信息面板]

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
