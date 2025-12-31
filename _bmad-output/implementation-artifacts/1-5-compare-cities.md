# Story 1.5: 城市对比（2-4 城，分维度对比，无综合总分）（MVP）

Status: done

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

- 本 Story 实现“雷达图对比”为主，表格对比为辅。
- 支持动态选择对比指标（用户可自定义展示哪些维度）。
- 不要求做账号体系；对比列表可临时保存在内存或 LocalStorage（可选）。

## Suggested Dimension Set (MVP 推荐)

优先使用 `/api/cities`（主线：SvelteKit API）已有字段：

- **基础信息**
  - 城市名（`name`）
  - 省份/区县（`province`/`district`）

- **可选维度字段（用户可动态选择 3-6 个）**
  - 房价（`price`） - 默认选中
  - 舒适天数（`comfort_days`） - 默认选中
  - 绿化率（`green_rate`） - 默认选中
  - 未来可扩展字段（从 `city.raw` 或新增字段）

> 注意：`rank` 不属于“维度指标”，且不能被解释为综合排名能力。

## Tasks / Subtasks

- [x] Task 1：确定对比入口与交互（AC: 1, 2）
  - [x] 在 `CityDetailCard` 组件中加入"加入对比"按钮
  - [x] 在页面底部添加"对比栏"，展示已选城市（0-4）和"开始对比"按钮
  - [x] 对比栏支持移除已选城市

- [x] Task 2：实现对比列表状态管理（AC: 1）
  - [x] 维护 `compareCities: City[]` 状态
  - [x] 限制最多 4 城；超过时 Toast 提示并拒绝加入
  - [x] 最少 2 城才能开始对比

- [x] Task 3：实现对比视图 - 雷达图（AC: 2, 3, 4）
  - [x] 创建 `ComparePanel.svelte` 组件（可拖拽、可关闭）
  - [x] 使用 Chart.js + chartjs-plugin-radar 实现雷达图
  - [x] 每个城市一条雷达线，不同颜色区分
  - [x] 雷达图下方显示表格对比（辅助）

- [x] Task 4：实现动态指标选择（AC: 3）
  - [x] 提供指标选择器（复选框），用户可选择 3-6 个维度
  - [x] 默认选中：`price`, `comfort_days`, `green_rate`
  - [x] 指标变更时雷达图实时更新

- [x] Task 5：数据标准化与空值处理（AC: 3, 4）
  - [x] 雷达图数据归一化（0-100 分），保留原始值在 tooltip 显示
  - [x] 缺失值在雷达图中显示为 0，表格中显示 `'-'`
  - [x] 数值格式化（房价带单位、绿化率带 %）

- [x] Task 6：口径守护（AC: 5）
  - [x] 对比 UI 不出现"综合评分/综合排名/躺平指数"文案
  - [x] 不新增天气/新闻调用

- [ ] Task 7：最小自测记录（AC: 1-5）
  - [ ] 截图：加入 2 城并打开雷达图对比
  - [ ] 截图：加入第 5 城时被拦截（最多 4 城）
  - [ ] 截图：动态切换指标后雷达图更新
  - [ ] 截图：某字段缺失时仍可对比

## Dev Notes

### 当前架构基线

- 主线实现以 SvelteKit 工程为准（`src/` 目录）
- 城市数据通过 `citiesAPI().list()` 获取，返回 `City[]` 类型
- 已有组件：`CityDetailCard.svelte`、`FilterPanel.svelte`
- 状态管理使用 Svelte 5 的 `$state()`

### 数据源与类型

`City` 接口字段（`src/lib/types/index.ts`）：

- `id`, `name`, `province`, `rank`, `lat`, `lng`
- `district`, `price`, `comfort_days`, `green_rate`

### 雷达图实现方案

**技术选型**：Chart.js + svelte-chartjs

```bash
npm install chart.js svelte-chartjs
```

**数据标准化策略**：

雷达图需要将不同量纲的指标归一化到 0-100 范围：

| 指标 | 原始范围 | 标准化方式 | 说明 |
|------|----------|------------|------|
| `price` | 0-50000+ | 反向标准化 | 房价越低越好，分数越高 |
| `comfort_days` | 0-365 | 正向标准化 | 天数越多越好 |
| `green_rate` | 0-100 | 直接使用 | 已是百分比 |

**标准化公式**：

```typescript
// 正向指标（越大越好）
score = ((value - min) / (max - min)) * 100

// 反向指标（越小越好，如房价）
score = ((max - value) / (max - min)) * 100
```

### 动态指标选择方案

```typescript
interface DimensionConfig {
  key: keyof City;           // 字段名
  label: string;             // 中文标签
  unit: string;              // 单位
  reverse: boolean;          // 是否反向（越小越好）
  min: number;               // 标准化最小值
  max: number;               // 标准化最大值
}

const AVAILABLE_DIMENSIONS: DimensionConfig[] = [
  { key: 'price', label: '房价', unit: '元/㎡', reverse: true, min: 3000, max: 50000 },
  { key: 'comfort_days', label: '舒适天数', unit: '天', reverse: false, min: 0, max: 300 },
  { key: 'green_rate', label: '绿化率', unit: '%', reverse: false, min: 0, max: 60 },
];
```

### UI 设计要点

1. **对比栏**：固定在页面底部，显示已选城市头像/名称
2. **对比面板**：可拖拽浮动组件，与 CityDetailCard/FilterPanel 风格一致
3. **雷达图**：占据主要区域，每个城市一条线，颜色区分
4. **指标选择器**：复选框列表，实时更新雷达图
5. **表格对比**：雷达图下方，显示原始数值

### 配色方案

**组件配色**（与现有组件保持一致）：

| 元素 | 颜色 | Tailwind 类 |
|------|------|-------------|
| 标题栏背景 | 蓝色渐变 | `bg-gradient-to-r from-blue-600 to-blue-700` |
| 主按钮 | 蓝色 | `bg-blue-600 hover:bg-blue-700` |
| 次按钮 | 灰色边框 | `border-gray-300 hover:bg-gray-50` |
| 输入框聚焦 | 蓝色 | `focus:border-blue-500 focus:ring-blue-500` |
| 强调文字 | 蓝色 | `text-blue-600` |
| 卡片背景 | 白色 | `bg-white` |
| 卡片阴影 | 大阴影 | `shadow-2xl ring-1 ring-gray-200` |

**雷达图城市配色**（最多 4 城）：

```typescript
const CITY_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgb(59, 130, 246)' },   // 蓝色 - City 1
  { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgb(16, 185, 129)' },   // 绿色 - City 2
  { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgb(245, 158, 11)' },   // 橙色 - City 3
  { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgb(139, 92, 246)' },   // 紫色 - City 4
];
```

| 城市序号 | 颜色名称 | 边框色 | 填充色（透明度 20%） |
|----------|----------|--------|---------------------|
| City 1 | 蓝色 | `#3B82F6` | `rgba(59, 130, 246, 0.2)` |
| City 2 | 绿色 | `#10B981` | `rgba(16, 185, 129, 0.2)` |
| City 3 | 橙色 | `#F59E0B` | `rgba(245, 158, 11, 0.2)` |
| City 4 | 紫色 | `#8B5CF6` | `rgba(139, 92, 246, 0.2)` |

**对比栏配色**：

| 元素 | 颜色 | 说明 |
|------|------|------|
| 背景 | `bg-white/95 backdrop-blur` | 半透明毛玻璃效果 |
| 城市标签 | 对应城市颜色 | 与雷达图颜色一致 |
| 移除按钮 | `text-gray-400 hover:text-red-500` | 悬停变红 |
| 开始对比按钮 | `bg-blue-600` | 主色调 |
| 禁用状态 | `bg-gray-300 cursor-not-allowed` | 城市不足 2 个时 |

**Chart.js 雷达图配置**：

```typescript
const chartOptions = {
  scales: {
    r: {
      min: 0,
      max: 100,
      ticks: {
        stepSize: 20,
        color: '#6B7280',           // gray-500
        backdropColor: 'transparent'
      },
      grid: {
        color: '#E5E7EB'            // gray-200
      },
      pointLabels: {
        color: '#374151',           // gray-700
        font: { size: 12 }
      }
    }
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20
      }
    }
  }
};
```

### 命令

- 启动 SvelteKit：`npm run dev`
- 访问页面：`http://localhost:5173/`

## Dev Agent Record

### Agent Model Used

Cascade

### Debug Log References

### Completion Notes List

### File List

**需创建**：

- `src/lib/components/CompareBar.svelte` - 底部对比栏组件
- `src/lib/components/ComparePanel.svelte` - 雷达图对比面板组件

**需修改**：

- `src/lib/components/CityDetailCard.svelte` - 添加“加入对比”按钮
- `src/routes/(app)/+page.svelte` - 集成对比栏和对比面板
- `src/lib/components/README.md` - 添加新组件文档

**已存在**：

- `src/lib/types/index.ts` - City 接口定义
- `src/lib/api/cities.ts` - API 客户端
- `src/routes/api/cities/+server.ts` - 城市列表 API
- `src/routes/api/cities/[id]/+server.ts` - 城市详情 API

**依赖安装**：

```bash
npm install chart.js svelte-chartjs
```
