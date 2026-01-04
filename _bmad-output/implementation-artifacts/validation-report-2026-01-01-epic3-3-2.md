# Validation Report

**Document:** `_bmad-output/implementation-artifacts/3-2-location-nearby-poi.md`
**Checklist:** SM 手工校验（基于 BMAD create-story 质量目标：可落地、无歧义、避免重复造轮子、明确约束与降级）
**Date:** 2026-01-01

## Summary

- Overall: 7/9 PASS
- Critical Issues: 1

## Section Results

### 1) Story / AC 清晰度

- [PASS] 用户目标清晰且可衡量
  - Evidence: Story（第 7-9 行）。
- [PASS] AC 覆盖“触发条件/半径/分类/联动/外链/稳定性”六要素
  - Evidence: AC 1-6（第 13-25 行）。
- [PARTIAL] POI 的“分类搜索参数”仍有实现口径选择（keywords vs types）
  - Evidence: Task 2 要求 keywords 或 types（第 35-37 行）。
  - Impact: Dev 需要决定最终口径；不过 story 已允许二选一，不阻塞实现。

### 2) Tasks 可执行性 / 可拆分性

- [PASS] Task 1 给出两条技术路线（JSAPI PlaceSearch vs WebService regeo）
  - Evidence: Task 1（第 29-32 行）。
- [PASS] 明确 marker 管理、清理与联动状态（poiMarkers/activePoiId）
  - Evidence: Task 4（第 50-58 行）。

### 3) 与现有代码复用一致性（防重复造轮子）

- [PASS] 明确复用现有定位链路与 marker
  - Evidence: Dev Notes（第 71-75 行）。

### 4) 架构/依赖/风险

- [PASS] PlaceSearch 插件加载方式已经与项目 loader 机制对齐
  - Evidence: Task 1 明确 `loadAmapScript({ plugins: [...] })`（第 29-32 行）。
- [CRITICAL / FAIL] “仅当 locationMarker 存在才显示入口”不足以支撑 POI 搜索
  - Evidence: AC 1 仅提到 `locationMarker`（第 13 行）；但 POI 搜索需要稳定的 `lng/lat`。
  - Impact: 若实现仅依赖 marker 对象，开发时容易遗漏“经纬度状态”，导致 POI 查询/联动困难。
  - Recommendation (Must Fix): 在实现中把 `handleLocateCity` 的 `{lng,lat}` 存为 `locatedLngLat`（或等价），POI 搜索与外链都使用这个坐标；marker 仅负责渲染。

### 5) 安全 / Key 管理

- [PASS] Story 已指出 WebService 需要走服务端代理避免 key 暴露
  - Evidence: Dev Notes（第 83-85 行）。
- [PARTIAL] PlaceSearch 属于前端 JSAPI 能力，key 本就出现在脚本 URL，这点与“避免 key 暴露”的表述可能让 dev 误解
  - Evidence: Dev Notes（第 79-85 行）。
  - Recommendation: 实现时明确区分：JSAPI key 暴露是既有事实；仅 WebService 调用需要服务端代理。

### 6) 性能

- [PASS] 有 marker 数量上限 guardrail
  - Evidence: Performance guardrails（第 87-89 行）。

### 7) 测试性

- [PASS] 提供纯函数测试建议
  - Evidence: Task 6（第 65-67 行）。

### 8) References 完整性

- [PASS] 外链规范已落到可直接实现的 URI API
  - Evidence: Task 5 给出 uri.amap.com 示例（第 60-63 行）；References 增加 URI API 文档（第 91-98 行）。

## Failed Items

1. [FAIL] 缺少对“定位点坐标状态”的显式要求（仅靠 marker 不够）

## Partial Items

1. [PARTIAL] 分类检索口径（keywords/types）需在实现时选定
2. [PARTIAL] JSAPI vs WebService 两条路线会影响后续架构（是否需要新 API route）

## Recommendations

1. Must Fix:
   - 增加并复用 `locatedLngLat`（或等价）作为 POI 搜索/外链/联动的唯一坐标来源。
2. Should Improve:
   - 规定每类默认展示前 N 条（例如 30），并在 UI 展示“已截断”的提示。
3. Consider:
   - PlaceSearch 的结果结构中通常包含地址、类型、距离字段；优先复用官方返回字段，减少自定义计算。
