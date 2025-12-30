# Story 2.6: 定时任务 + 可观测性 + 手动触发（通用数据管道能力）（Phase 2）

Status: backlog

## Story

As a 维护者/开发者,
I want 有一套可控的定时任务系统来更新动态/抓取类数据，并能查看日志、失败原因、并在后台手动触发,
so that 我可以稳定维护数据管道并快速定位问题。

## Acceptance Criteria

1. 定时任务可用：至少支持两类任务（可先 stub）：
   - 天气更新（例如每小时）
   - 新闻更新（例如每日）
2. 手动触发可用：后台提供一个入口可以手动触发某类任务（或触发某城市的更新）。
3. 日志可追溯：
   - 每次任务执行记录开始/结束时间、成功/失败状态、失败原因（至少 stdout + 可选落库）。
4. 幂等与限流：重复触发不会导致数据库脏写或无限请求；对第三方调用有基本限流/退避。
5. 不影响主流程：定时任务失败不阻断 `GET /api/cities` 等核心功能。

## Tasks / Subtasks

- [ ] Task 1：选择任务运行方式（AC: 1）
  - [ ] 最小方案：使用系统 cron/`node-cron` + 单进程任务
  - [ ] 或：用脚本方式（`npm run job:weather` / `npm run job:news`）再由 cron 调度

- [ ] Task 2：抽象 Job Runner（AC: 3-5）
  - [ ] 统一的 Job 接口：name、params、run、timeout、retry
  - [ ] 错误分类：可重试/不可重试

- [ ] Task 3：落库（可选，但推荐）（AC: 3）
  - [ ] `JobRun` 表：jobName、status、startedAt、finishedAt、errorMessage、meta

- [ ] Task 4：后台手动触发入口（AC: 2）
  - [ ] 提供按钮：触发天气更新/新闻更新
  - [ ] 展示最近 N 次运行结果

- [ ] Task 5：最小自测记录（AC: 1-5）
  - [ ] 截图：后台手动触发
  - [ ] 截图：最近运行记录

## Dev Notes

### 与其它 Story 的关系

- 该 Story 为 `2-2 动态数据` 与 `2-3 社交评价` 提供通用基础设施（定时更新、可追溯、可人工兜底）。

### References

- [Source: docs/prd/prd-product.md#Phase 2 Backlog: 动态数据（天气/新闻）]
- [Source: docs/prd/prd-product.md#Phase 3/4 爬虫日志与手动触发按钮]

## Dev Agent Record

### Agent Model Used

Cascade
