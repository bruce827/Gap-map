# 组件库 (Components)

本目录存放项目中可复用的 Svelte 组件。

## 组件列表

### CityDetailCard

**文件**: `CityDetailCard.svelte`

**用途**: 展示当前点击城市的详情信息，作为浮动卡片显示在地图上方。

**功能特性**:
- 可拖拽 - 拖动标题栏移动位置
- 可最小化 - 收起为圆形图标
- 可关闭 - 完全隐藏卡片
- 实时更新 - 点击其他城市时数据自动更新

**Props**:

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `city` | `City \| null` | 是 | - | 城市数据对象 |
| `loading` | `boolean` | 否 | `false` | 是否显示加载状态 |
| `error` | `string` | 否 | `''` | 错误信息 |
| `onclose` | `() => void` | 否 | - | 关闭回调函数 |

**使用示例**:

```svelte
<script lang="ts">
  import CityDetailCard from '$lib/components/CityDetailCard.svelte';
  import type { City } from '$lib/types';

  let showCard = $state(false);
  let city = $state<City | null>(null);
  let loading = $state(false);
  let error = $state('');
</script>

{#if showCard}
  <CityDetailCard
    {city}
    {loading}
    {error}
    onclose={() => showCard = false}
  />
{/if}
```

---

### FilterPanel

**文件**: `FilterPanel.svelte`

**用途**: 筛选与排序城市数据，控制地图上 marker 的显示/隐藏。

**功能特性**:

- 可拖拽 - 拖动标题栏移动位置
- 可最小化 - 收起为圆形图标
- 4 个筛选条件 - 房价上限、舒适天数下限、省份、绿化率下限
- 2 个排序指标 - 房价、舒适天数（支持升序/降序）
- Top 5 结果列表 - 排序后显示前 5 名城市

**Props**:

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `cities` | `City[]` | 是 | 全量城市数据 |
| `provinces` | `string[]` | 是 | 省份列表（用于下拉选择） |
| `onfilter` | `(filtered: City[]) => void` | 是 | 筛选结果回调 |
| `onsort` | `(sorted: City[]) => void` | 是 | 排序结果回调 |

**使用示例**:

```svelte
<script lang="ts">
  import FilterPanel from '$lib/components/FilterPanel.svelte';
  import type { City } from '$lib/types';

  let allCities = $state<City[]>([]);
  let provinces = $state<string[]>([]);

  function handleFilter(filtered: City[]) {
    // 控制 marker 显示/隐藏
  }

  function handleSort(sorted: City[]) {
    // 更新排序后的城市列表
  }
</script>

{#if allCities.length > 0}
  <FilterPanel
    cities={allCities}
    {provinces}
    onfilter={handleFilter}
    onsort={handleSort}
  />
{/if}
```

---

### CompareBar

**文件**: `CompareBar.svelte`

**用途**: 底部对比栏，展示已选城市并提供对比入口。

**功能特性**:

- 固定在页面底部
- 显示已选城市（0-4 个）
- 支持移除已选城市
- 城市数量不足 2 个时禁用"开始对比"按钮

**Props**:

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `cities` | `City[]` | 是 | 已选城市列表 |
| `onremove` | `(cityId: string) => void` | 是 | 移除城市回调 |
| `oncompare` | `() => void` | 是 | 开始对比回调 |
| `maxCities` | `number` | 否 | 最大城市数，默认 4 |

---

### ComparePanel

**文件**: `ComparePanel.svelte`

**用途**: 雷达图对比面板，展示多城市多维度对比。

**功能特性**:

- 可拖拽、可最小化、可关闭
- 雷达图展示（Chart.js）
- 动态指标选择（3-6 个）
- 表格对比（辅助）
- 数据标准化（0-100 分）

**Props**:

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `cities` | `City[]` | 是 | 对比城市列表（2-4 个） |
| `onclose` | `() => void` | 是 | 关闭回调 |

**配色方案**:

| 城市序号 | 颜色 | 边框色 |
|----------|------|--------|
| City 1 | 蓝色 | `#3B82F6` |
| City 2 | 绿色 | `#10B981` |
| City 3 | 橙色 | `#F59E0B` |
| City 4 | 紫色 | `#8B5CF6` |

---

## 组件开发规范

1. **命名**: 使用 PascalCase，如 `CityDetailCard.svelte`
2. **Props**: 使用 Svelte 5 的 `$props()` 语法定义
3. **状态**: 使用 `$state()` 管理组件内部状态
4. **样式**: 使用 Tailwind CSS
5. **类型**: 必须定义 TypeScript 接口
6. **文档**: 新增组件后更新本 README
