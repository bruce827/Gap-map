# Story 3.1: 定位点环境视图增强（卫星/路网/3D）

Status: ready-for-dev

## Story

As a 用户,
I want 在定位到某个城市的具体点位后，能一键切换标准/卫星/（可选）路网叠加/（可选）3D 视角,
so that 我可以更直观地观察该点周边的道路、地形与建成区分布，从而理解环境而不依赖街景。

## Acceptance Criteria

1. 定位成功后，地图提供至少两种可切换视图：
   - 标准（默认）
   - 卫星
2. （加分）卫星视图可叠加路网图层（卫星 + 路网），且可随时关闭。
3. 视图切换不影响：
   - 城市点位 marker 的显示/点击
   - 已定位点 marker 的显示
4. 稳定性与降级：
   - AMap 脚本加载失败、Key 缺失、或图层对象不可用时：UI 不崩溃，给出可见提示，并保持在标准视图。
   - 若 3D 能力不可用或代价过高，可不实现 3D，仅保留（标准/卫星/路网）。

## Tasks / Subtasks

- [ ] Task 1：建立“定位点视图模式”状态与最小 UI（AC: 1, 3）
  - [ ] 在 `src/routes/(app)/+page.svelte` 增加 `viewMode`（例如：`'standard' | 'satellite' | 'satellite-roadnet'`）。
  - [ ] 仅当存在 `locationMarker`（或 `locatedPoint`）时，显示一个轻量控制条（建议放在地图容器右上角 overlay）。
  - [ ] UI 至少包含：标准 / 卫星 两个按钮。

- [ ] Task 2：实现卫星/路网图层的创建、挂载与卸载（AC: 1-3）
  - [ ] 在 AMap 初始化成功后，延迟创建图层对象（避免 SSR/未加载 AMap 时引用）：
    - `new AMap.TileLayer.Satellite()`
    - `new AMap.TileLayer.RoadNet()`
  - [ ] 切换逻辑：
    - 标准：确保移除卫星/路网图层（若已添加）。
    - 卫星：添加卫星图层；移除路网图层（或不添加）。
    - 卫星+路网：同时添加卫星与路网图层。
  - [ ] 约束：
    - 不重建整个地图实例（除非 3D 被选中且只能重建）。
    - 不影响现有 `createCityMarkers()` marker 逻辑。

- [ ] Task 3：（可选）3D 视角能力评估与降级策略（AC: 4）
  - [ ] 先以“不做 3D”为默认实现：把 3D 作为后续增强。
  - [ ] 若要做 3D：必须明确是否需要重建 `new AMap.Map(... viewMode: '3D')`，并评估对现有 marker/状态的影响；若影响过大则保持不做。

- [ ] Task 4：最小验证（AC: 1-4）
  - [ ] 手动验证：定位一个城市后，切换标准/卫星/卫星+路网（若实现），确认 marker 都还在且可点击。
  - [ ] 加一条单元测试或最小自动检查（推荐，但不强制）：
    - 对“视图模式 -> 期望图层集合”的纯函数做测试（node:test），确保切换逻辑不会遗漏 remove。

## Dev Notes

### Existing behavior to extend (do not reinvent)

- 定位入口已存在：`src/lib/components/CityDetailCard.svelte` 的“定位”按钮调用父组件回调 `onlocate(city)`。
- 定位实现已存在：`src/routes/(app)/+page.svelte` 的 `handleLocateCity(city)`
  - 拼地址：`buildCityAddress(city)`
  - 地理编码：`geocodeAddress(address)`（依赖 `AMap.Geocoder`）
  - 地图定位：`mapRef.setZoomAndCenter(14, [lng, lat])`
  - 定位 marker：`locationMarker = new AMapRef.Marker({ content: '<div class="amap-locate-marker"></div>' })`

### Guardrails / Non-goals

- 不实现街景/全景（已明确不可控 iframe，且 JS API 无官方街景能力）。
- 不引入 POI 搜索、路线规划、可达性等功能（这些属于 Story 3-2 / 3-3）。
- 不新增动态数据调用（天气/新闻属于 Epic 2）。

### AMap layer API hints

- 官方卫星图层与路网图层属于 TileLayer：
  - `AMap.TileLayer.Satellite`
  - `AMap.TileLayer.RoadNet`
- 典型用法是创建图层对象后 `map.add(layer)` / `map.remove(layer)`。

### References

- [Source: _bmad-output/implementation-artifacts/epics.md#Story 3-1：定位点环境视图增强（卫星/路网/3D）]
- [Source: docs/增加定位信息.md]
- [Source: src/routes/(app)/+page.svelte]
- [Source: src/lib/components/CityDetailCard.svelte]
- [Source: https://lbs.amap.com/api/jsapi-v2/guide/map/map-layer]

## Dev Agent Record

### Agent Model Used

Cascade

### Debug Log References

### Completion Notes List

### File List

- src/routes/(app)/+page.svelte
- (optional) src/lib/components/CityDetailCard.svelte
- (optional) tests/* (node:test)
