# Story 1.3: 城市详情（分维度指标展示，无综合总分/排名）（MVP）

Status: review

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

- [x] Task 1：实现单城市详情 API 端点（AC: 2, 5）
  - [x] 在 `src/routes/api/cities/[id]/+server.ts` 创建 `GET /api/cities/[id]` 端点
  - [x] 调用 `cityRepository.findById(id)` 获取城市详情
  - [x] 返回 `City` 类型数据，404 时返回错误

- [x] Task 2：确认详情容器的实现形态与触发路径（AC: 1）
  - [x] 在 `src/routes/(app)/+page.svelte` 实现详情容器（Modal/侧栏/卡片）
  - [x] 点击地图点位后，调用 `/api/cities/[id]` 获取详情
  - [x] 使用 `src/lib/api/cities.ts` 的 API 客户端封装调用

- [x] Task 3：确定"分维度字段清单"（至少 5 项）（AC: 2, 5）
  - [x] 使用 `City` 类型的字段（`src/lib/types/index.ts`）：
    - `name`（城市名称）- 必选
    - `province`（省份）
    - `district`（区县）
    - `price`（房价，单位：元）
    - `comfort_days`（舒适天数）
    - `green_rate`（绿化率）
  - [x] **不要**把 `rank` 解释为"综合排名"

- [x] Task 4：字段映射与展示（AC: 2, 5）
  - [x] 创建字段配置数组，定义 label 和格式化规则
  - [x] 数值格式化：
    - [x] 金额：保持元为单位，千分位格式化
    - [x] 百分比：`green_rate` 补齐 `%`
    - [x] 天数：`comfort_days` 补齐"天"

- [x] Task 5：空值与异常兜底（AC: 3, 4）
  - [x] 缺失字段（`null`）显示 `'-'` 或 `'暂无'`
  - [x] API 错误时显示"加载失败"提示
  - [x] 城市不存在时显示 404 提示

- [x] Task 6：口径守护（AC: 4）
  - [x] 不新增任何天气/新闻调用
  - [x] 详情 UI 文案中不出现"综合评分/综合排名/躺平指数"

- [ ] Task 7：最小自测记录（AC: 1-4）
  - [ ] 截图：打开详情容器
  - [ ] 截图：展示 >= 5 个字段
  - [ ] 截图：某字段缺失时的兜底展示

- [x] Task 8：完善字段展示（AC: 2）
  - [x] 增加区县字段独立展示
  - [x] 增加排名字段独立展示  
  - [x] 确保至少展示 5 个分维度字段

## Dev Notes

### 项目架构（已更新）

项目采用分层架构，详见 `README.md`：

1. **表现层** (`src/routes/`) - SvelteKit 页面和 API 路由
2. **业务层** (`src/lib/api/`) - API 客户端封装
3. **数据层** (`src/lib/server/repositories/`) - 数据访问层
4. **持久层** (`prisma/` + `data/`) - Prisma ORM + SQLite

### 关键文件

| 文件 | 用途 |
|------|------|
| `src/lib/types/index.ts` | `City` 类型定义（已有 6 个字段） |
| `src/lib/server/repositories/city.repository.ts` | `findById()` 方法已实现 |
| `src/lib/api/cities.ts` | API 客户端（需新增 `getById()` 方法） |
| `src/routes/api/cities/[id]/+server.ts` | 需创建：单城市 API 端点 |
| `src/routes/(app)/+page.svelte` | 需修改：添加详情容器 |

### City 类型字段（来自 `src/lib/types/index.ts`）

```typescript
interface City {
  id: string;
  name: string;
  province: string | null;
  rank: number | null;        // 不作为"综合排名"展示
  lat: number | null;
  lng: number | null;
  district: string | null;
  price: number | null;       // 房价（元）
  comfort_days: number | null; // 舒适天数
  green_rate: number | null;   // 绿化率
}
```

### MVP scope alignment

- `docs/prd/prd-product.md` 明确：
  - MVP **点击点位可打开详情并展示关键分维度字段**
  - MVP **不做** 动态数据（天气/新闻）
  - MVP **不做** 综合躺平指数/排名

### 实现建议

1. **API 端点**：在 `src/routes/api/cities/[id]/+server.ts` 创建，调用 `cityRepository.findById()`
2. **API 客户端**：在 `src/lib/api/cities.ts` 新增 `getById(id: string)` 方法
3. **详情容器**：在 `+page.svelte` 使用 Modal 组件（可用 flowbite-svelte）
4. **字段格式化**：创建 `formatCityField()` 工具函数处理空值和单位

### Commands

- 启动 SvelteKit：`pnpm dev`
- 访问页面：`http://127.0.0.1:5173/`
- 类型检查：`npm run check`

### References

- [Source: README.md#项目架构]
- [Source: src/lib/types/index.ts#City]
- [Source: src/lib/server/repositories/city.repository.ts#findById]
- [Source: docs/prd/prd-product.md#3.1.5 MVP范围与验收标准]
- [Source: docs/prd/prd-product.md#3.2.1 核心功能#功能2: 城市基础信息面板]

## Dev Agent Record

### Agent Model Used

Cascade

### Debug Log References

### Completion Notes List

### File List

**需创建：**

- src/routes/api/cities/[id]/+server.ts（单城市 API 端点）

**需修改：**

- src/lib/api/cities.ts（新增 `getById()` 方法）
- src/routes/(app)/+page.svelte（添加详情容器）

**已存在（参考）：**

- src/lib/types/index.ts（City 类型定义）
- src/lib/server/repositories/city.repository.ts（findById 已实现）
- src/routes/api/cities/+server.ts（城市列表 API）
- docs/prd/prd-product.md
