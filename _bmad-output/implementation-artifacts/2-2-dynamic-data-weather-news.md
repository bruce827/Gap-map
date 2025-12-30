# Story 2.2: 动态数据（天气/新闻）接入与展示（Phase 2）

Status: backlog

## Story

As a 用户,
I want 在城市详情中查看该城市的实时天气与近期新闻,
so that 我可以把静态指标与动态环境结合，做更接近现实的判断。

## Acceptance Criteria

1. 天气数据可用：对至少 5-10 个测试城市，能获取并展示：
   - 当前温度/天气状况
   - 空气质量（AQI）
   - 7 日预报（至少高低温 + 天气图标/描述）
2. 新闻数据可用：能展示城市相关新闻（至少最近 3 天的若干条），包含标题、来源、发布时间、原文链接。
3. 数据更新策略明确：
   - 天气：至少支持“按需拉取 + 缓存”（或定时任务）。
   - 新闻：至少支持“定时更新”（例如每日更新）。
4. 稳定性：第三方 API 失败/超时/限流时，前端有可理解的降级展示（例如“暂无动态数据/稍后重试”），不影响静态字段渲染。
5. 安全：
   - API Key 只通过环境变量注入，不出现在前端 bundle 与仓库。
   - 对外只暴露“代理 API”，不让前端直接调用第三方。

## Tasks / Subtasks

- [ ] Task 1：确定数据源与字段口径（AC: 1-3）
  - [ ] 天气：优先选择和风天气（PRD 推荐）或其他稳定 Provider。
  - [ ] 新闻：选择聚合新闻 API 或搜索型聚合（注意合规与版权）。

- [ ] Task 2：设计数据模型与存储策略（AC: 3-4）
  - [ ] 选择一种最小可用方案：
    - [ ] 不落库：仅代理 + 短缓存（适合早期试验）；或
    - [ ] 落库：存入 SQLite（便于限流与复用）。
  - [ ] 若落库：为天气与新闻建立表结构（包含城市标识、抓取时间、payload、过期时间）。

- [ ] Task 3：实现 Weather 代理 API（AC: 1, 4, 5）
  - [ ] `GET /api/weather?city=...`：
    - [ ] 优先读缓存/DB
    - [ ] 过期则拉取第三方
    - [ ] 失败则返回可降级的结构
  - [ ] 添加超时与重试策略（最小实现即可）。

- [ ] Task 4：实现 News 代理 API（AC: 2, 4, 5）
  - [ ] `GET /api/news?city=...`：
    - [ ] 返回结构化列表（title/source/publishedAt/url）
    - [ ] 支持定时更新或手动触发更新

- [ ] Task 5：前端展示（AC: 1-4）
  - [ ] 城市详情新增 Tab：`动态数据`（与静态指标分隔，避免用户误解口径）。
  - [ ] 天气组件：当前 + 7 日预报
  - [ ] 新闻组件：列表 + 外链

- [ ] Task 6：最小自测记录（AC: 1-5）
  - [ ] 截图：一座城市的动态数据 tab
  - [ ] 截图：API 失败时降级态

## Dev Notes

### MVP/Phase alignment

- 本 Story 属于 Phase 2；MVP 阶段明确不接入动态数据。

### Key management

- 需要新增环境变量（示例）：
  - `QWEATHER_KEY=...`
  - `NEWS_API_KEY=...`

### References

- [Source: docs/prd/prd-product.md#功能3: 实时数据面板（Phase 2，非MVP）]
- [Source: docs/prd/prd-product.md#Phase 2 Backlog: 动态数据（天气/新闻）]

## Dev Agent Record

### Agent Model Used

Cascade
