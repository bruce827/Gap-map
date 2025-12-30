# Gap-map 改造检查清单

## 📋 实施检查清单

### ✅ 准备阶段

- [ ] 备份了数据库文件 `data/gapmap.db`
- [ ] 备份了 `src/` 文件夹
- [x] 清楚了 6 个改造阶段

### ✅ 阶段 1：类型定义

- [x] 创建了 `src/lib/types/index.ts` 文件
- [x] 定义了两层城市类型：`CityPoint`（地图最小字段）/ `City`（完整字段）
- [x] 定义了 `ApiError` / `AppConfig`
- [x] 运行 `npm run check` 无错误

### ✅ 阶段 2：API 客户端

- [x] 创建了 `src/lib/api/client.ts` 文件
  - [x] 实现了 `apiClient()` 函数（统一 fetch + JSON）
  - [ ] 支持重试机制（可选，后续再加）
  - [x] 支持超时控制（AbortController）
  - [x] 有错误处理（`ApiClientError` + 解析 `{ error }`）
- [x] 创建了 `src/lib/api/cities.ts` 文件（`citiesAPI`）
  - [x] 实现了 `citiesAPI.list()`
  - [x] 实现了 `citiesAPI.search()`（注意：后端 search 路由尚未实现）
  - [x] 实现了 `citiesAPI.getById()`（注意：后端 [id] 路由尚未实现）
- [x] 创建了 `src/lib/api/config.ts` 文件（`configAPI.get()`）
- [x] 运行 `npm run check` 无错误

#### （可选）阶段 2.5：前端迁移到 API 客户端

- [x] `src/routes/(app)/+page.svelte` 使用 `citiesAPI().list()` 获取城市列表
- [x] 仍保留 `normalizeCities()` 作为点位过滤逻辑

### ✅ 阶段 3：Repository 层

- [x] 创建了 `src/lib/server/repositories/city.repository.ts` 文件
  - [x] 实现了 `cityRepository.findAll()`
  - [x] 实现了 `cityRepository.findAllPoints()`（过滤并生成 `CityPoint[]`）
  - [x] 实现了 `cityRepository.findById()`
  - [x] 实现了 `cityRepository.findByName()`
  - [x] 提供了数据转换辅助函数（如 `toNumberOrNull` / `toCityPoint`）
- [x] 运行 `npm run check` 无错误

### ✅ 阶段 4：页面数据加载

- [ ] 创建了 `src/routes/(app)/+page.server.ts` 文件
  - [ ] 实现了 `load()` 函数
  - [ ] 调用了 `cityRepository.findAll()`
  - [ ] 返回了 `{ config, cities }`
  - [ ] 有错误处理逻辑
- [ ] 运行 `npm run check` 无错误
- [ ] 启动开发服务器：`npm run dev`
- [ ] 浏览器访问 `http://localhost:5173/`
  - [ ] 页面能加载（无白屏）
  - [ ] 地图能显示
  - [ ] 城市标记能显示
  - [ ] 控制台无错误

### ✅ 阶段 5：API 路由优化

- [x] 更新了 `src/routes/api/cities/+server.ts`
  - [x] 使用了 `cityRepository.findAll()`
  - [x] 返回 `City[]`
  - [x] 有错误处理
- [ ] 创建了 `src/routes/api/cities/search/+server.ts`
  - [ ] 支持 `?q=` 查询参数
  - [ ] 调用了 `cityRepository.findByName()`
  - [ ] 有错误处理
- [ ] 更新 `src/routes/api/cities/[id]/+server.ts`
  - [ ] 使用 `cityRepository.findById()`
  - [ ] 如果找不到返回 404
  - [ ] 有错误处理
- [x] 更新 `src/routes/api/config/+server.ts`
  - [x] 缺失 `AMAP_KEY` 时返回 500 + error
  - [x] 有错误处理
- [ ] 运行 `npm run check` 无错误
- [ ] 测试 API 端点：
  - [ ] `curl http://localhost:5173/api/cities` 返回城市列表
  - [ ] `curl http://localhost:5173/api/cities/search?q=北` 返回搜索结果
  - [ ] `curl http://localhost:5173/api/cities/110000` 返回单个城市或 404
  - [ ] `curl http://localhost:5173/api/config` 返回配置

### ✅ 阶段 6：组件重构

- [ ] 更新 `src/routes/(app)/+page.svelte`
  - [ ] 导入 `PageData` 类型
  - [ ] 声明 `export let data: PageData`
  - [ ] 移除 onMount 中的初始化 fetch（目前仍在使用 onMount）
  - [ ] 移除 `loading` / `warning` 状态
  - [ ] 添加搜索功能
  - [ ] 简化代码
- [ ] 运行 `npm run check` 无错误
- [ ] 开发服务器热重载页面
- [ ] 浏览器验证功能：
  - [ ] 地图正常加载
  - [ ] 城市标记显示
  - [ ] 点击标记显示城市名
  - [ ] 搜索框能搜索城市
  - [ ] 搜索结果正确
  - [ ] 控制台无错误

### ✅ 最终验证

- [ ] 所有 `npm run check` 通过
- [ ] `npm run build` 成功构建
- [ ] `npm run dev` 开发服务器启动
- [ ] 所有功能正常工作
- [ ] 没有控制台错误或警告
- [ ] 没有破坏现有功能

---

## 📊 进度追踪

| 阶段 | 名称 | 完成时间 | 耗时 | 备注 |
| ------ | ------ | --------- | ------ | ------ |
| 1 | 类型定义 | 2025-12-30 | - | 已完成（`CityPoint/City` 两层） |
| 2 | API 客户端 | 2025-12-30 | - | 已完成（超时+错误处理；重试未做） |
| 3 | Repository 层 | 2025-12-30 | - | 已完成（含 `findAllPoints`） |
| 4 | 页面加载 | - | - | 未开始 |
| 5 | API 优化 | 2025-12-30 | - | 部分完成（`/api/cities`、`/api/config`） |
| 6 | 组件重构 | - | - | 未开始 |
| **总计** | **6 个阶段** | - | - | **计划 1-2h** |

---

## 遇到问题？

| 问题 | 解决方案 |
| ------ | --------- |
| **导入错误** | 检查文件路径，确保 `src/lib/types/index.ts` 存在，运行 `npm run prepare` |
| **TypeScript 错误** | 查看错误详情，检查接口定义，确保所有字段名正确 |
| **npm run check 失败** | 逐个修复 TypeScript 错误，查看错误行号和建议 |
| **页面白屏** | 检查浏览器控制台错误，查看服务端日志，确保数据库有数据 |
| **地图不显示** | 检查 [.env](http://_vscodecontentref_/11) 中的 `AMAP_KEY` 是否配置，查看浏览器控制台错误 |
| **API 404** | 确认新建的 API 文件是否创建，路径是否正确 |
| **搜索无结果** | 确保 `cityRepository.findByName()` 工作正常，测试数据是否存在 |
| **热重载不工作** | 尝试手动刷新浏览器，或重启开发服务器 |

---

**完成所有检查后，你的 Gap-map 就成功升级为规范的大型项目架构了！** 🎉