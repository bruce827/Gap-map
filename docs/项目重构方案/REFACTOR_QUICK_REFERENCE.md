# Gap-map 改造快速参考

## 当前仓库已落地（截至 2025-12-30）

- ✅ 阶段 1：类型定义 `src/lib/types/index.ts`（已拆分 `CityPoint` / `City`）
- ✅ 阶段 2：API client `src/lib/api/*`（超时+错误处理；重试未做）
- ✅ 阶段 3：Repository `src/lib/server/repositories/city.repository.ts`
- 🟠 阶段 5：API 优化（已完成 `/api/cities`、`/api/config`；search/[id] 待实现）

## 关键文件一览

- `src/lib/types/index.ts`
- `src/lib/api/client.ts`
- `src/lib/api/cities.ts`
- `src/lib/api/config.ts`
- `src/lib/server/repositories/city.repository.ts`
- `src/routes/api/cities/+server.ts`
- `src/routes/api/config/+server.ts`

## 常用验证命令

- `npm run check`
- `npm test`

## 下一步建议（按优先级）

1. 实现 `src/routes/api/cities/search/+server.ts`（接 `cityRepository.findByName()`）
2. 实现 `src/routes/api/cities/[id]/+server.ts`（接 `cityRepository.findById()`；不存在返回 404）
3. 再考虑 `+page.server.ts`（阶段 4）与页面组件数据流重构（阶段 6），避免过早引入大范围 UI 返工
