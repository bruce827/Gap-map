# Gap-map 改造快速开始指南

## ⏱️ 5 分钟快速了解

### 改造是什么？
将 Gap-map 从"快速原型"升级为"大型项目规范"的全栈应用。

### 核心改造点
1. **类型系统** - 前后端共享的 TypeScript 接口
2. **API 封装** - 统一的 fetch 包装（错误处理、重试）
3. **分层架构** - Repository → Service → Controller 三层
4. **服务端加载** - 页面加载前就准备好所有数据
5. **清晰职责** - 每个文件只负责一件事

### 收益
- ✅ IDE 智能提示
- ✅ 编译期类型检查
- ✅ 更快的首屏加载
- ✅ 更容易的维护和扩展

### 需要多长时间？
**约 1-2 小时**，分 6 个阶段，可逐步实施（推荐按阶段渐进迁移，避免一次性重写）。

### 当前仓库进度（已完成）

- 已完成阶段 1-3：types（含 `CityPoint/City` 两层）、API client、Repository
- 已完成阶段 5 的一部分：`/api/cities` 与 `/api/config` 已优化/迁移
- 已完成可选阶段 2.5：地图页已使用 `citiesAPI().list()` 获取城市数据

---

## 🚀 第一次实施？Follow 这个步骤

### Step 1：准备工作（5 分钟）
```bash
# 备份数据库和 src 文件夹
cp data/gapmap.db data/gapmap.db.backup
cp -r src src.backup

# 创建 types 文件夹
mkdir -p src/lib/types
mkdir -p src/lib/api
mkdir -p src/lib/server/repositories

# 运行类型检查（会自动 svelte-kit sync）
npm run check

# 运行测试回归
npm test
```