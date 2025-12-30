# Epic 2（Phase 2）开工前 5 分钟检查清单（聚焦 2-1 + 2-6）

Status: drafted

## 0) 先统一环境（避免“写 A 库、读 B 库”）

- `DATABASE_URL`：确认 `.env` 里是 `DATABASE_URL="file:./data/gapmap.db"`
- 主线读库：确认根目录 SvelteKit（Prisma）读取 `DATABASE_URL` 指向的 SQLite 文件（建议与 `data/gapmap.db` 是同一份）
- 备份：开始写操作前，先复制一份 `data/gapmap.db`

## 2-1 Admin CRUD（后台管理端）开工检查

### 1) 最关键：你到底写哪张表？

- `/api/cities` 读的是 SQLite 视图 `v_tangping_cities`
- 后台写入必须写到：
  - 视图引用的基础表；或
  - 新建“可编辑城市表”并更新 `prisma/views.sql` 的视图 join（改动更大）

快速核对：

- 打开 `prisma/views.sql`，定位 `v_tangping_cities` 的 `FROM ...`
- 再打开 `prisma/schema.prisma`，确认对应 Prisma Model 与主键字段

### 2) 鉴权最小方案（先别做复杂）

- `.env` 新增：`ADMIN_PASSWORD="..."`
- 建议：Basic Auth 或简单密码门禁即可（先求可用）

验收：

- 未鉴权访问 `/admin` 被拒绝/跳转
- 鉴权通过才能进行写操作

### 3) 最小可交付 UI

- 列表页：表格 + 搜索（按城市名）
- 新增/编辑：至少字段 `name/lng/lat`
- 删除：二次确认

### 4) 2-1 最小验收闭环

- 后台新增一个城市（`name/lng/lat`）
- 刷新前台页面
- `GET /api/cities` 能看到该城市
- 地图点位出现（如果前台做了点位渲染）

## 2-6 Jobs/Observability（定时任务 + 手动触发 + 日志）开工检查

### 1) 先选“跑任务”的最小方式

- 推荐起步：脚本式 Job
  - `npm run job:weather`
  - `npm run job:news`
- 后续再接 cron/调度器；避免一开始就做进程内定时导致重复执行与幂等难题

### 2) JobRunner 必备约束

- 并发：默认 `concurrency=1`
- 超时：外部请求必须有超时（例如 15s）
- 幂等：重复触发不会疯狂写库/刷 API（至少按 `cityId + 时间窗口` 做去重）

### 3) 日志/可追溯最小实现

- 最小：stdout 打印 `jobName/startedAt/finishedAt/status/error`
- 推荐：落库一张 `JobRun` 表，后台可展示最近 N 次运行

### 4) 手动触发入口

- 提供一个仅后台可用的触发接口（示例）：
  - `POST /api/admin/jobs/run?job=weather&cityId=...`（SvelteKit：`src/routes/api/admin/jobs/run/+server.ts`）
- 管理端页面提供按钮触发 weather/news

### 5) 2-6 最小验收闭环

- 后台点击“手动触发 weather”
- 能看到一次运行结果（成功/失败）
- 失败时有明确原因（超时/限流/解析失败等）
- 失败不影响 `/api/cities` 与前台静态功能

## Dev Agent Record

### Agent Model Used

Cascade
