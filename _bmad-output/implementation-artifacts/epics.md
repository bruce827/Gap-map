# Gap-map Epics & Stories（MVP）

> 目标：把 `docs/prd/prd-index.md` 中的 MVP 任务拆分清单固化为可执行的 Epic + Stories。
> 口径：路线B（Prisma + SQLite 为 MVP 默认），动态数据与综合总分/排名均为 Phase 2（非MVP）。

---

## Epic 1：MVP 核心闭环（数据 → 地图 → 详情 → 探索/对比）

### Epic 1 Objective

- 在本地 SQLite 数据库基础上，完成“城市列表可查 → 地图点位可看 → 城市分维度信息可读 → 可筛选/排序/对比”的最小闭环。

### Epic 1 Out of Scope（Epic 级）

- 天气/新闻等动态数据（Phase 2 Backlog）
- 综合躺平指数/综合排名（Phase 2 Backlog；MVP 仅分维度展示）

### Story 0-1：项目初始化（SvelteKit 主应用 + Prisma 数据层 + Admin 路由骨架）

- **Story Key**: 0-1-project-initialization
- **User Story**: 作为开发者，我希望按 PRD 技术架构完成主应用工程初始化（SvelteKit 全栈）并打通 Prisma/SQLite 的本地链路，同时预置 `/admin` 骨架，从而让后续功能不依赖 demo 原型作为主线。
- **Acceptance Criteria**:
  1. SvelteKit 工程可启动并可访问页面。
  2. TailwindCSS + UI 组件库（按 PRD）可用。
  3. Prisma + SQLite 本地开发链路可用。
  4. `src/routes/api/` 与 `/admin` 路由骨架存在。
- **Dependencies**: 无
- **References**:
  - [Source: docs/product_brief.md#核心技术栈]
  - [Source: docs/prd/prd-index.md#三、开发环境搭建]

### Story 1-1：数据层可用（城市列表查询可用）

- **Story Key**: 1-1-data-layer-city-list
- **User Story**: 作为维护者/开发者，我希望能稳定查询城市列表（至少包含 name/lng/lat 等字段），从而支撑地图点位渲染与详情页展示。
- **Acceptance Criteria**:
  1. 至少 10 条城市数据可被查询到（含经纬度）。
  2. 有一个稳定的数据查询入口（例如 demo 的 `/api/cities` 或 Prisma 查询）返回城市列表。
  3. 返回数据包含最小字段：`name`, `lng`, `lat`（可扩展 `province`, `price`, `comfort_days` 等）。
  4. 空值/缺字段不会导致接口或页面崩溃（空态/兜底）。
- **Dependencies**: 0-1-project-initialization
- **Implementation Notes**:
  - 现有 demo: `demo/server.js` 使用 SQLite 只读连接读取 `v_tangping_cities`。
  - 数据库：`data/gapmap.db`；视图定义见 `prisma/views.sql`（如需重建视图）。
- **References**:
  - [Source: demo/server.js]
  - [Source: prisma/schema.prisma]
  - [Source: docs/prd/prd-product.md#3.1.5 MVP范围与验收标准]

### Story 1-2：地图页点位渲染 + 点击

- **Story Key**: 1-2-map-city-points
- **User Story**: 作为用户，我希望在地图上看到城市点位并可点击打开详情容器，从而快速进入城市信息。
- **Acceptance Criteria**:
  1. 地图可加载并展示不少于 10 个城市点位。
  2. 点击点位后能打开详情容器（卡片/侧栏均可），至少显示城市名称。
  3. 异常/空数据时不崩溃。
- **Dependencies**: 0-1-project-initialization, 1-1-data-layer-city-list
- **References**:
  - [Source: docs/prd/prd-product.md#3.2.1 核心功能]

### Story 1-3：城市详情（分维度指标展示，无综合总分/排名）

- **Story Key**: 1-3-city-details-dimensions
- **User Story**: 作为用户，我希望查看城市的基础信息与分维度指标，从而做初步决策。
- **Acceptance Criteria**:
  1. 详情页/卡片展示至少 5 个分维度字段（例如房价/租金、医疗、交通、气候、生活）。
  2. 不展示“综合总分/综合排名”。
  3. 缺失字段显示“暂无/未知”且不报错。
- **Dependencies**: 0-1-project-initialization, 1-2-map-city-points

### Story 1-4：筛选与排序（单指标）

- **Story Key**: 1-4-filter-sort-single-metric
- **User Story**: 作为用户，我希望按条件筛选城市并按单指标排序，从而更快缩小候选范围。
- **Acceptance Criteria**:
  1. 至少 3 个筛选条件生效（例如：房价范围、是否有高铁/机场、沿海/内陆）。
  2. 至少 2 个单指标排序生效（升/降明确）。
  3. 不提供综合排名。
- **Dependencies**: 0-1-project-initialization, 1-1-data-layer-city-list

### Story 1-5：城市对比（2-4 城）

- **Story Key**: 1-5-compare-cities
- **User Story**: 作为用户，我希望对比 2-4 个城市的分维度指标，从而更清晰地做选择。
- **Acceptance Criteria**:
  1. 至少支持 2 城进入对比；最多 4 城。
  2. 至少 5 个维度对比清晰。
  3. 不提供综合总分。
- **Dependencies**: 0-1-project-initialization, 1-3-city-details-dimensions

### Story 1-6：数据维护入口（脚本或后台 CRUD）

- **Story Key**: 1-6-data-maintenance
- **User Story**: 作为维护者，我希望能新增/更新城市数据，并在前台即时可见，从而低成本维护项目数据。
- **Acceptance Criteria**:
  1. 新增/更新一条城市数据后，前台读取到最新值。
  2. 失败时能定位原因（日志/报错信息）。
- **Dependencies**: 0-1-project-initialization, 1-1-data-layer-city-list

---

## Epic 2：Phase 2 增强（管理端 + 动态数据 + 社交评价 + 个性化 + 综合指数）

### Epic 2 Objective

- 在 MVP 的静态数据与地图交互基础上，引入：
  - 后台管理端（城市 CRUD + 简单鉴权）
  - 动态数据（天气/新闻）
  - 社交媒体评价聚合（重点城市）
  - 个性化收藏/标签/笔记（本地持久化）
  - 综合指数/综合排序（可解释/可配置）
  - 定时任务与可观测性（任务日志 + 手动触发）

### Epic 2 Out of Scope（Epic 级）

- 大规模、高频率抓取导致的合规风险（默认低频 + 可控 + 可追溯）。
- 强账号体系/多端同步（Phase 3+）。

### Story 2-1：后台管理端（城市 CRUD + 简单鉴权）

- **Story Key**: 2-1-admin-city-crud
- **User Story**: 作为维护者/运营者，我希望在后台新增/编辑/删除城市数据，并能在前台刷新后立即可见。
- **Acceptance Criteria**:
  1. `/admin` 后台入口可用且需要简单鉴权（环境变量密码）。
  2. 城市列表 + 搜索可用；新增/编辑/删除可用。
  3. 修改后刷新前台，`GET /api/cities` 可见变更。
- **Dependencies**: 1-1-data-layer-city-list
- **References**:
  - [Source: docs/prd/prd-product.md#Phase 2: 后台管理端开发 (第2周)]

### Story 2-2：动态数据（天气/新闻）接入与展示

- **Story Key**: 2-2-dynamic-data-weather-news
- **User Story**: 作为用户，我希望在城市详情中查看实时天气与近期新闻，并在失败时优雅降级。
- **Acceptance Criteria**:
  1. 天气：当前 + AQI + 7 日预报。
  2. 新闻：最近 3 天若干条（含外链）。
  3. 仅通过服务端代理 API 暴露能力，Key 不落前端。
- **Dependencies**: 1-3-city-details-dimensions
- **References**:
  - [Source: docs/prd/prd-product.md#功能3: 实时数据面板（Phase 2，非MVP）]
  - [Source: docs/prd/prd-product.md#Phase 2 Backlog: 动态数据（天气/新闻）]

### Story 2-3：社交媒体评价聚合（重点城市）

- **Story Key**: 2-3-social-review-aggregation
- **User Story**: 作为用户，我希望看到重点城市的社交评价聚合，并可跳转原文。
- **Acceptance Criteria**:
  1. 至少 2 个平台（小红书/微博/知乎中的任意 2 个）。
  2. 重点城市白名单（5-10 个）可用。
  3. 数据可追溯（抓取时间/来源）。
- **Dependencies**: 1-3-city-details-dimensions
- **References**:
  - [Source: docs/prd/prd-product.md#功能4: 社交媒体评价聚合]

### Story 2-4：个性化收藏/标签/笔记（LocalStorage）

- **Story Key**: 2-4-favorites-tags-notes
- **User Story**: 作为用户，我希望收藏城市、打标签并写笔记，且刷新后仍保留。
- **Acceptance Criteria**:
  1. 收藏/取消收藏可用。
  2. 标签与笔记可用。
  3. LocalStorage 持久化，Phase 2 不上云。
- **Dependencies**: 1-3-city-details-dimensions
- **References**:
  - [Source: docs/prd/prd-product.md#功能6: 个性化收藏与标签]

### Story 2-5：综合指数/综合排名（可解释、可配置）

- **Story Key**: 2-5-composite-index-ranking
- **User Story**: 作为用户，我希望有综合分/综合排序，并能理解权重与计算方式。
- **Acceptance Criteria**:
  1. 输出 `composite_score` 并可排序。
  2. 权重/维度可解释。
  3. 缺失字段策略明确且不崩溃。
- **Dependencies**: 1-1-data-layer-city-list
- **References**:
  - [Source: docs/prd/prd-product.md#综合指数/排名在 Phase 2 迭代]

### Story 2-6：定时任务 + 可观测性 + 手动触发

- **Story Key**: 2-6-scheduled-jobs-observability
- **User Story**: 作为维护者，我希望定时更新动态/抓取数据，并能手动触发与查看运行记录。
- **Acceptance Criteria**:
  1. 支持至少两类任务（天气/新闻）。
  2. 后台可手动触发。
  3. 有运行日志与失败原因。
- **Dependencies**: 2-1-admin-city-crud
- **References**:
  - [Source: docs/prd/prd-product.md#Phase 2 Backlog: 动态数据（天气/新闻）]

---

## Phase 2 Backlog（非MVP）

- 动态数据：天气/新闻
- 综合评分/排名：综合躺平指数（可解释）
- 社交评价增强：Playwright + AI识别低频抓取 + 可追溯日志/截图
