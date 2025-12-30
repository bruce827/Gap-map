# Gap-map 改造阶段索引

## 改造阶段

> 当前仓库已完成：阶段 1-3；阶段 5 部分完成（`/api/cities`、`/api/config` 已迁移）；其余阶段待做。

### 阶段 1：创建类型定义系统

**文件：** `src/lib/types/index.ts`
**耗时：** 5 分钟
**优先级：** 🔴 最高（其他所有阶段都依赖它）

**创建内容：**

- API 响应相关类型
- 城市相关类型
- 配置相关类型
- 页面数据类型
- 地图相关类型

**关键点：**

- 统一定义前后端都要使用的类型
- 使用 `interface` 而不是 `type`（更容易扩展）
- 详细的 JSDoc 注释

**当前状态：** ✅ 已完成（已按两层拆分：`CityPoint` / `City`）

参考文件：`docs/项目重构方案/完整方案.md`

---

### 阶段 2：创建 API 客户端封装

**文件：**

- `src/lib/api/client.ts` - 通用 API 客户端
- `src/lib/api/cities.ts` - 城市 API 调用

**耗时：** 10 分钟
**优先级：** 🟠 高

**创建内容：**

- `apiClient()` 函数 - fetch 包装
- 错误处理（HTTP 状态码、网络错误）
- 重试机制（指数退避）
- 超时控制
- 查询参数处理
- `citiesAPI` - 城市相关的 API 函数集合

**关键点：**

- 提供统一的错误处理
- 支持自动重试和超时
- 类型安全（所有返回值都有类型）
- 可在服务端和浏览器中使用

**当前状态：** ✅ 已完成（已实现超时+错误处理；重试机制未实现，属于可选增强）

参考文件：`docs/项目重构方案/完整方案.md`

---

### 阶段 3：创建数据访问层（Repository）

**文件：** `src/lib/server/repositories/city.repository.ts`
**耗时：** 10 分钟
**优先级：** 🟠 高

**创建内容：**

- `cityRepository.findAll()` - 获取所有城市
- `cityRepository.findById()` - 按 ID 获取城市
- `cityRepository.findByName()` - 按名称搜索城市
- `cityRepository.findByProvince()` - 按省份获取城市
- 数据转换函数

**关键点：**

- 将所有数据库操作集中在这一层
- 统一处理数据格式转换（数据库格式 → 业务格式）
- 易于测试（可以 mock）
- 易于复用（可以在多个地方调用）

**当前状态：** ✅ 已完成（包含 `findAllPoints()` 生成 `CityPoint[]`）

参考文件：`docs/项目重构方案/完整方案.md`

---

### 阶段 4：创建页面数据加载层

**文件：** `src/routes/(app)/+page.server.ts`
**耗时：** 5 分钟
**优先级：** 🟠 高

**创建内容：**

- `export const load: PageServerLoad` - 页面加载函数
- 获取配置
- 获取城市列表
- 错误处理

**关键点：**

- 在页面加载时就获取所有初始数据
- 在服务端执行（更安全、避免在浏览器里暴露敏感配置）

**当前状态：** ⏳ 未开始

---

### 阶段 5：API 路由优化

**目标：** 让 API 路由只负责 HTTP 协议与错误处理；业务查询全部走 Repository。

**当前状态：** 🟠 部分完成

- ✅ `src/routes/api/cities/+server.ts` 已迁移至 `cityRepository.findAll()`
- ✅ `src/routes/api/config/+server.ts` 已补齐缺 key 的 500 错误返回
- ⏳ `src/routes/api/cities/search/+server.ts` 未实现
- ⏳ `src/routes/api/cities/[id]/+server.ts` 当前返回 501（未实现）

### 阶段 6：组件重构

**目标：** 将页面初始数据获取迁移到 `+page.server.ts`，页面组件仅消费 `data`，减少 onMount 副作用与状态分支。
**当前状态：** ⏳ 未开始（当前页面仍使用 onMount 初始化 map + 请求数据）