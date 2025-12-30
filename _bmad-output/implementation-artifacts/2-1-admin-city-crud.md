# Story 2.1: 后台管理端（城市 CRUD + 简单鉴权）（Phase 2）

Status: backlog

## Story

As a 维护者/运营者,
I want 在一个受保护的后台页面里新增/编辑/删除城市数据，并能立即在前台地图/详情中看到更新,
so that 我可以低成本维护数据、纠错并持续迭代指标。

## Acceptance Criteria

1. 后台入口可用：存在一个后台入口（例如 `/admin`），默认不对公众暴露（需要简单鉴权）。
2. 城市列表页可用：可查看城市列表（表格），支持搜索（至少按城市名）。
3. 城市新增/编辑可用：
   - 新增“躺平城市”时，不创建新的行政区划城市（不新增 `City.id`）。
   - 通过搜索/选择既有 `City`（行政区划）来创建或维护对应的 `TangpingCity` 及其维度数据。
   - 对于既有 `City`，允许修正 `lat/lng` 等基础字段（如果你希望允许该类维护）。
   - 能编辑一条城市记录的若干字段并保存。
   - 字段校验失败时有可理解的错误提示。
4. 城市删除可用：能删除城市记录（或软删除），前台不再出现该城市。
5. 前台即时可见：对城市的新增/编辑/删除，在刷新前台后能通过 `GET /api/cities` 看到变化。
6. 安全与审计（MVP for Phase 2）：
   - 不硬编码密码；鉴权凭据来自环境变量。
   - 对写操作有基本日志（至少 stdout 打印变更类型与城市标识）。

## Tasks / Subtasks

- [ ] Task 1：确认后台实现方式与数据写入的 Source of Truth（AC: 1, 5）
  - [ ] 阅读 `prisma/views.sql`，确认 `v_tangping_cities` 的来源链路：`TangpingCity` + `City` + 维度表（Housing/Medical/Climate/Living/Transport）。
  - [ ] 阅读 `prisma/schema.prisma`，确认：
    - [ ] `City` 是全量行政区划主数据（不由后台创建 `City.id`）。
    - [ ] 后台新增“躺平城市”应创建/维护 `TangpingCity`（`TangpingCity.cityId` 指向既有 `City.id`）。
  - [ ] 明确“删除”的产品语义：
    - [ ] 删除“躺平城市”= 删除/下架 `TangpingCity`（让其不再出现在 `v_tangping_cities`）。
    - [ ] 不删除 `City`（保留行政区划主数据）。

- [ ] Task 2：实现简单鉴权（AC: 1, 6）
  - [ ] 选择一种低成本方案：
    - [ ] Basic Auth；或
    - [ ] 访问后台页面前输入密码（Session/Cookie）；或
    - [ ] 管理端专用 token。
  - [ ] 从环境变量读取密码（例如 `ADMIN_PASSWORD`），不写入仓库。

- [ ] Task 3：后台路由与页面（AC: 2-4）
  - [ ] 列表页：表格展示 + 搜索 + （可选）分页
  - [ ] 编辑页/弹窗：字段表单 + 校验 + 保存
  - [ ] 新增页/弹窗：
    - [ ] 先搜索/选择既有 `City`（行政区划）
    - [ ] 再创建/维护对应的 `TangpingCity` 与维度表数据
    - [ ] City 选择器（建议实现为“搜索选择”而不是自由输入）（决策 A：不允许创建 `City.id`）
      - [ ] 交互：
        - [ ] 支持按城市名关键字搜索（模糊匹配）
        - [ ] （可选）支持按省份过滤（下拉选择 `Province.shortName`）
      - [ ] 展示字段（避免误选同名城市）：
        - [ ] `province.shortName + city.name + city.id`
      - [ ] 性能策略：
        - [ ] 不一次性加载全部 City 到前端；使用服务端查询（带分页/limit）
        - [ ] 输入框 debounce（例如 300ms）
      - [ ] 防误选校验：
        - [ ] 提交时强制 `cityId` 必须存在于 `City` 表
        - [ ] 若 `TangpingCity` 已存在，新增应转为“编辑/跳转”而不是报错
  - [ ] 删除：二次确认
  - [ ] （可选）地图选点：点击地图自动填充经纬度

- [ ] Task 4：写 API（或服务层）封装（AC: 5）
  - [ ] 实现城市的 `POST/PUT/DELETE` 写接口
  - [ ] 确保与当前前台 `GET /api/cities` 返回的字段兼容
  - [ ] 写入后不需要重建视图（除非改了 `prisma/views.sql`）

- [ ] Task 5：最小自测记录（AC: 1-6）
  - [ ] 新增一个城市（截图/录屏）
  - [ ] 编辑一个字段（截图/录屏）
  - [ ] 删除一个城市（截图/录屏）
  - [ ] 刷新前台看到变化（截图）

## Dev Notes

### Source of truth

- Phase 2 的前台/查询数据源是 SQLite 视图 `v_tangping_cities`（定义见 `prisma/views.sql`）。
- `v_tangping_cities` 的主表是 `TangpingCity`，并 join `City` 与各维度表。
- 决策 A：`City` 表视为全量行政区划主数据：
  - 后台不允许创建新的 `City.id`。
  - “新增躺平城市”应通过选择既有 `City`，再创建/维护对应 `TangpingCity`（以及维度表）。
  - “删除躺平城市”优先等价为删除/下架 `TangpingCity`，不删除 `City`。

### Data safety

- 写入前建议做本地 DB 备份（例如复制 `data/gapmap.db`），避免误删导致不可逆。

### References

- [Source: docs/prd/prd-product.md#Phase 2: 后台管理端开发 (第2周)]
- [Source: demo/server.js#/api/cities]
- [Source: prisma/schema.prisma]
- [Source: prisma/views.sql]

## Dev Agent Record

### Agent Model Used

Cascade
