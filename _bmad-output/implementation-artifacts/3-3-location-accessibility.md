# Story 3.3: 定位点可达性摘要（到关键 POI 的时间/距离）

Status: ready-for-dev

## Story

As a 用户,
I want 在周边 POI 的基础上，看到定位点到关键设施的可达性摘要（步行/驾车的时间或距离）,
so that 我可以更直观判断生活便利度与通勤成本，而不仅仅是“附近有什么”。

## Acceptance Criteria

1. 触发条件：在已定位点存在且周边 POI 已加载（或至少用户选中了某个 POI）时，才展示可达性摘要。
2. 摘要内容：对用户选定的 1-3 个 POI，展示至少一种交通方式的摘要：
   - 路线可用时：展示时间（分钟）与距离（公里/米）
   - 路线不可用时：至少展示距离（公里/米），并在 UI 中明确标注“直线距离（降级）”
3. 失败降级：
   - 路线规划失败/限流/插件不可用时，降级为直线距离（haversine 计算），并提示“当前仅显示直线距离”。
4. 不影响主流程：计算失败不会影响地图与 POI 列表使用。
5. 性能：单次计算限制并发与次数（例如最多同时计算 3 条），避免卡顿。

## Tasks / Subtasks

- [ ] Task 1：确定可达性实现路径（AC: 2-5）
  - [ ] 优先：AMap JS API 路线规划插件（Driving / Walking）
  - [ ] 降级：仅计算直线距离（不依赖路线插件）

- [ ] Task 2：建立“选中 POI 集合”交互（AC: 1-2）
  - [ ] 在 3-2 周边 POI 面板中加入“加入对比/加入可达性”按钮（最多 3 个）。
  - [ ] 维护 `selectedPoisForAccessibility` 状态（最多 3 条）。

- [ ] Task 3：实现路线计算与摘要格式化（AC: 2, 5）
  - [ ] 若使用 Driving/Walking：在 AMap 脚本加载时按需引入插件（仅在启用该能力时加载）。
  - [ ] 统一输出结构：`{ poiId, mode, distanceMeters, durationSeconds, source: 'route' | 'straight' }`
  - [ ] UI 展示：分钟与公里/米格式化，避免大数与小数噪音。

- [ ] Task 4：失败降级到直线距离（AC: 3-4）
  - [ ] 路线不可用时：计算直线距离并展示。
  - [ ] 提示文案：明确是降级结果。

- [ ] Task 5：最小验证（AC: 1-5）
  - [ ] 手动验证：选 1-3 个 POI → 展示摘要 → 人为触发失败（例如禁用插件或断网）→ 降级到直线距离。
  - [ ] 自动化（推荐）：为直线距离计算函数写 node:test。

## Dev Notes

### Scope boundaries

- 本 Story 不负责“POI 搜索/分类/渲染”（那是 3-2）。
- 本 Story只在“用户已选 POI”的前提下计算摘要并展示。

### Recommended minimal first implementation

- 第一版可以只做“直线距离 + 备注提示”，把 Driving/Walking 路线规划放到后续迭代（仍可满足 AC 的降级路径）。

### References

- [Source: _bmad-output/implementation-artifacts/epics.md#Story 3-3：定位点可达性摘要]
- [Source: docs/prd/prd-product.md#功能12: 移动场景适配]
- [Source: src/routes/(app)/+page.svelte]

## Dev Agent Record

### Agent Model Used

Cascade

### Debug Log References

### Completion Notes List

### File List

- src/routes/(app)/+page.svelte
- (optional) src/lib/utils/geo.ts
- tests/* (optional)
