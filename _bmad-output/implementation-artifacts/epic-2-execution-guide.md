# Epic 2（Phase 2）执行策略 / 对齐文档

Status: drafted

## 目标与边界

### Epic Objective

- 在 MVP（静态数据 + 地图浏览 + 详情/筛选/对比 + 脚本维护）的基础上，补齐 Phase 2 能力：
  - 后台管理端：城市 CRUD + 简单鉴权
  - 动态数据：天气/新闻（服务端代理 + 缓存/落库 + 前端展示）
  - 社交媒体评价：重点城市聚合（低频 + 可追溯）
  - 个性化：收藏/标签/笔记（本地持久化）
  - 综合指数/排名：可解释、可配置
  - 通用数据管道：定时任务、运行日志、手动触发

### 非目标（明确不做）

- 高强度抓取与不可控爬虫（默认低频、可关停、可追溯）。
- 强账号体系/多端同步（Phase 3+）。
- 将综合分当作产品唯一入口（综合分仅辅助，分维度信息仍是主信息）。

## 推荐交付顺序（最小返工路径）

1. **2-1 Admin 城市 CRUD**
   - 先把“写入路径”打通（写入到视图背后的基础表，或引入可编辑表并更新视图）。
2. **2-6 Job Runner + 可观测性 + 手动触发**
   - 先把任务框架与日志打好，后续 2-2/2-3 只是插件式 job。
3. **2-2 动态数据（天气/新闻）**
   - 优先做天气（更结构化、易缓存），再做新闻（更复杂，涉及合规与质量）。
4. **2-3 社交评价聚合（重点城市）**
   - 强建议先“人工维护 + 定期更新”，再引入低频抓取。
5. **2-4 个性化收藏/标签/笔记**
   - 本地 LocalStorage 即可，依赖少。
6. **2-5 综合指数/排名**
   - 放最后做，避免口径争议影响 Phase 2 前半程交付。

## 环境变量清单（建议统一写在 repo 根目录 `.env`）

### 必需（Phase 2）

- `DATABASE_URL="file:./data/gapmap.db"`
- `ADMIN_PASSWORD="..."`（2-1 管理端鉴权）

### 动态数据（2-2）

- `QWEATHER_KEY="..."`（若使用和风天气）
- `NEWS_API_KEY="..."`（若使用聚合新闻 API；或你实际选择的 Provider Key）

### 可选（如果你做更强的观测/任务能力）

- `JOB_CONCURRENCY="1"`（并发控制，默认 1）
- `JOB_TIMEOUT_MS="15000"`（外部请求超时）
- `JOB_LOG_LEVEL="info"`

## 数据模型建议（最小可用，不要求一次到位）

> 目标：保证缓存、追溯与限流可控。是否落库可以按演进来。

### 方案 A：先不落库（更快）

- Weather/News 只做服务端代理 + 短缓存（内存/文件缓存）。
- 风险：进程重启缓存丢失、难审计、难查历史。

### 方案 B：落库（推荐）

- **WeatherSnapshot**（按城市 + 抓取时间）
  - `cityId`
  - `provider`
  - `payloadJson`
  - `fetchedAt`
  - `expiresAt`
- **NewsItem**（按城市 + 外链唯一性去重）
  - `cityId`
  - `provider`
  - `title`
  - `source`
  - `url`
  - `publishedAt`
  - `fetchedAt`
- **SocialMention**（社交内容聚合；建议先重点城市）
  - `cityId`
  - `platform`
  - `title`
  - `summary`
  - `url`
  - `publishedAt`（可空）
  - `fetchedAt`
  - （可选）`coverImageUrl`、`likeCount`
- **JobRun**（任务运行日志，强烈推荐）
  - `jobName`
  - `status`（success/failure）
  - `startedAt`
  - `finishedAt`
  - `errorMessage`
  - `metaJson`（可放 cityId、provider、重试次数等）

## API 约定（建议先统一这些口径）

### Admin（2-1）

- `GET /admin`（页面）
- `POST /api/cities`（新增）
- `PUT /api/cities/[id]`（更新；SvelteKit：`src/routes/api/cities/[id]/+server.ts`）
- `DELETE /api/cities/[id]`（删除；SvelteKit：`src/routes/api/cities/[id]/+server.ts`）

### Dynamic（2-2）

- `GET /api/weather?cityId=...`（或 cityName，但推荐 cityId）
- `GET /api/news?cityId=...`

### Social（2-3）

- `GET /api/social?cityId=...&platform=...`（platform 可选）

### Jobs（2-6）

- `POST /api/admin/jobs/run?job=weather&cityId=...`（示例）
- `GET /api/admin/jobs/runs?job=weather&limit=20`

## 最小验收闭环（你可以直接照抄做验收）

### 闭环 1：管理端写入可用（2-1）

- 新增一个城市（含 `name/lng/lat`）
- 刷新前台页面
- `GET /api/cities` 返回中能看到新城市
- 地图上出现 marker（若前台实现了渲染）

### 闭环 2：天气动态数据可用（2-2）

- 打开某城市详情 → `动态数据` Tab
- 成功态：显示当前天气 + AQI + 7 日预报
- 失败态：断网/模拟 429 → UI 显示“暂无动态数据/稍后重试”，静态字段不受影响

### 闭环 3：任务与追溯可用（2-6）

- 后台手动触发一次 weather job
- 在 JobRun 列表看到一次运行记录（成功/失败）
- 失败时有可读错误信息（超时/限流/解析失败等）

## 安全与合规提示（必须对齐）

- **API Key 不得出现在前端**：一律走服务端代理。
- **新闻/社交内容尽量只做“摘要 + 跳转原文”**，避免复制全文造成版权风险。
- **抓取要可关停**：提供开关（环境变量/后台开关），一旦出现封禁或投诉可快速停用。
- **低频优先**：先按重点城市白名单 + 每周/月更新。

## Story 文件索引

- `2-1-admin-city-crud.md`
- `2-2-dynamic-data-weather-news.md`
- `2-3-social-review-aggregation.md`
- `2-4-favorites-tags-notes.md`
- `2-5-composite-index-ranking.md`
- `2-6-scheduled-jobs-observability.md`

## Dev Agent Record

### Agent Model Used

Cascade
