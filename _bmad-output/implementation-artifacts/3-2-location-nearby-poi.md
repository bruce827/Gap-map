# Story 3.2: 定位点周边 POI 探索（分类 + 半径 + 列表联动）

Status: ready-for-dev

## Story

As a 用户,
I want 在定位到某个具体点位后，能按“半径 + 分类”查看周边 POI，并在列表与地图之间联动,
so that 我可以系统评估该点位周边的生活便利度（医疗/交通/生活休闲等），更直观地理解环境。

## Acceptance Criteria

1. 触发条件：仅当已定位到一个点位时，才显示“周边 POI”入口/面板。
   - 必须存在稳定的定位点坐标状态（例如 `locatedLngLat: { lng: number; lat: number }`），作为 POI 搜索/外链/联动的唯一坐标来源。
   - `locationMarker` 仅作为渲染结果，不应作为坐标数据源。
2. 半径选择：至少支持 2 档半径（建议：500m、1km）。
3. 分类选择：至少支持 3 类 POI：
   - 医疗（医院/诊所等）
   - 交通（地铁站/公交站等）
   - 生活/休闲（商超/公园/健身等）
4. 地图与列表联动：
   - 列表点击某 POI → 地图居中到该 POI，并高亮（marker 样式变化或打开 InfoWindow）。
   - 地图点击某 POI marker → 列表滚动到对应项并高亮。
5. 外链详情：每个 POI 支持“在高德打开”外链（新开 Tab），用于查看更详细信息。
6. 稳定性：
   - POI 搜索失败/限流/Key 缺失时不崩溃，面板显示可理解的错误提示。
   - POI 结果过多时需要有限制（例如只展示前 N 条），避免一次性渲染过多 marker 造成卡顿。

## Tasks / Subtasks

- [ ] Task 1：确定 POI 获取方式（JS API PlaceSearch vs WebService 逆地理）与插件加载（AC: 2-3, 6）
  - [ ] 默认优先：JS API `AMap.PlaceSearch`（支持直接在地图上绘制 marker 与 panel，也支持回调自定义 UI）。
  - [ ] 备选/降级：WebService 逆地理编码 `regeo`（`extensions=all` + `radius`）获取附近 `pois`。
  - [ ] 若使用 PlaceSearch：在加载 AMap 脚本时增加插件：`AMap.PlaceSearch`（与现有 `loadAmapScript({ plugins: [...] })` 机制一致）。

- [ ] Task 1.5：补齐定位点坐标状态（AC: 1）
  - [ ] 在 `src/routes/(app)/+page.svelte` 的 `handleLocateCity` 中，将 `geocodeAddress` 返回的 `{ lng, lat }` 写入 `locatedLngLat`（或等价状态）。
  - [ ] 后续 POI 搜索参数、外链 URL、以及“列表点击 POI → 地图居中”均使用该状态，不从 `locationMarker` 反取坐标。

- [ ] Task 2：建立 POI 数据模型与分类配置（AC: 3）
  - [ ] 建一个前端分类配置表（3 类），每类包含：
    - label（中文名称）
    - keywords 或 types（用于搜索）
  - [ ] 建一个统一的 POI 结构（用于列表展示/联动），至少包含：
    - `id`（如可得，优先用 poiId；否则用 `${lng},${lat},${name}` 的组合）
    - `name`
    - `type`（文本或分类）
    - `location: { lng, lat }`
    - `address`（可选）
    - `distance`（可选）

- [ ] Task 3：实现“周边 POI 面板”UI（AC: 1-5）
  - [ ] 建议复用现有浮层风格：在地图页面 overlay 一个右侧抽屉/卡片。
  - [ ] UI 至少包含：分类切换、半径选择、加载状态、错误态、结果列表。

- [ ] Task 4：POI marker 管理与联动（AC: 4, 6）
  - [ ] 新增 `poiMarkers` 状态（数组）与 `activePoiId`。
  - [ ] 每次查询前先清理旧 POI markers（避免叠加与内存泄漏）。
  - [ ] 创建 POI marker：
    - 可用 `AMap.Marker` + `extData` 存 POI 对象
    - 绑定 click → 设置 active + 列表联动
  - [ ] 高亮策略：
    - 打开 InfoWindow；或
    - 变更 marker content/style（建议最小化：InfoWindow 即可）。

- [ ] Task 5：外链“在高德打开”（AC: 5）
  - [ ] 使用 URI API 的最小可用方式：通过经纬度+名称拼接高德 URL（新开 Tab）。
    - [ ] 示例：`https://uri.amap.com/marker?position=<lng>,<lat>&name=<name>&coordinate=gaode&callnative=0`
  - [ ] 约束：不要求 app 内嵌，不要求调起 App。

- [ ] Task 6：最小验证（AC: 1-6）
  - [ ] 手动验证：定位一个城市 → 打开周边 POI → 切换半径/分类 → 点击列表与 marker 联动。
  - [ ] 自动化（推荐但不强制）：对“分类配置 -> 搜索参数”的纯函数做 node:test。

## Dev Notes

### Existing behavior to extend

- 定位入口与定位 marker 已存在于：
  - `src/lib/components/CityDetailCard.svelte`（定位按钮）
  - `src/routes/(app)/+page.svelte`（`handleLocateCity` 负责 geocode + setZoomAndCenter + locationMarker）

### Recommended POI strategy

- 优先 JS API（PlaceSearch）：
  - 通过 `AMap.plugin(["AMap.PlaceSearch"], cb)` 引入
  - 使用 `placeSearch.searchNearBy(...)`（中心点 + 半径）或关键词搜索
  - 不强制使用官方 panel，建议在回调中渲染自定义列表（更符合你当前 UI 架构）
- 降级方案（WebService regeo）：
  - GET `https://restapi.amap.com/v3/geocode/regeo?key=...&location=lng,lat&radius=1000&extensions=all`
  - 在服务端 API route 代理（避免 key 暴露前端 bundle）

### Performance guardrails

- 建议限制每次最多渲染 N 个 POI marker（例如 30-50），其余仅列表展示或提示“缩小半径/细分分类”。

### References

- [Source: _bmad-output/implementation-artifacts/epics.md#Story 3-2：定位点周边 POI 探索]
- [Source: src/routes/(app)/+page.svelte]
- [Source: src/lib/components/CityDetailCard.svelte]
- [Source: https://lbs.amap.com/api/javascript-api-v2/tutorails/search-poi]
- [Source: https://lbs.amap.com/api/webservice/guide/api/georegeo]
- [Source: https://lbs.amap.com/api/uri-api/guide/mobile-web/point]

## Dev Agent Record

### Agent Model Used

Cascade

### Debug Log References

### Completion Notes List

### File List

- src/routes/(app)/+page.svelte
- (new, optional) src/lib/components/NearbyPoiPanel.svelte
- (new, optional) src/routes/api/amap/regeo/+server.ts (若走 WebService 代理)
- tests/* (optional)
