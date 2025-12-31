# Gap-map

一个地理数据管理和可视化系统，用于区域、城市地理信息的处理、存储和展示。

## 项目结构

### 📁 详细目录结构

```text
gap-map/
├── 📄 配置文件
│   ├── package.json          # 项目配置和依赖
│   ├── svelte.config.js      # SvelteKit 配置
│   ├── vite.config.ts        # Vite 构建配置
│   ├── tsconfig.json         # TypeScript 配置
│   ├── tailwind.config.cjs   # Tailwind CSS 配置
│   ├── postcss.config.cjs    # PostCSS 配置
│   └── .env                  # 环境变量
├── 🗄️ 数据库相关
│   ├── prisma/               # Prisma ORM 配置
│   │   ├── schema.prisma     # 数据模型定义
│   │   └── views.sql         # SQLite 视图定义
│   └── data/                 # 数据文件
│       └── gapmap.db         # SQLite 数据库
├── 📚 源代码 (src/)
│   ├── app.html              # HTML 模板
│   ├── app.css               # 全局样式
│   ├── app.d.ts              # 全局类型声明
│   ├── lib/                  # 共享库代码
│   │   ├── api/              # API 客户端
│   │   │   ├── client.ts     # 通用 API 客户端
│   │   │   ├── cities.ts     # 城市 API
│   │   │   └── config.ts     # 配置 API
│   │   ├── server/           # 服务端专用代码
│   │   │   └── repositories/ # 数据访问层
│   │   │       └── city.repository.ts
│   │   ├── types/            # 类型定义
│   │   │   └── index.ts      # 共享类型 (City, CityPoint, etc.)
│   │   ├── amap.js           # 高德地图相关
│   │   └── cities.js         # 城市数据处理
│   └── routes/               # 文件系统路由
│       ├── +layout.svelte    # 根布局组件
│       ├── (app)/            # 路由组 - 主应用
│       │   ├── +page.svelte  # 主页面（地图展示）
│       │   └── +page.server.ts # 服务端数据加载
│       ├── admin/            # 管理端页面
│       └── api/              # API 路由
│           ├── cities/
│           │   ├── +server.ts    # GET /api/cities
│           │   └── search/
│           │       └── +server.ts # GET /api/cities/search
│           ├── config/
│           │   └── +server.ts    # GET /api/config
│           └── health/
│               └── +server.ts    # GET /api/health
├── 🛠️ 工具和脚本
│   ├── scripts/              # 数据处理脚本
│   │   ├── import-csv.ts     # CSV 数据导入
│   │   └── import-area.ts    # 区域数据导入
│   └── tests/                # 测试文件
├── 📖 文档
│   └── docs/                 # 项目文档
│       └── 项目重构方案/      # 重构相关文档
└── 🎯 原型演示
    └── demo/                 # Express 原型（非主线代码）
```

### 🎯 SvelteKit 特性

- **文件系统路由**: `src/routes/` 下的文件自动映射为 URL
- **服务端渲染**: `+page.server.ts` 在服务端预加载数据
- **API 路由**: `+server.ts` 文件创建 REST API 端点
- **类型安全**: 完整的 TypeScript 支持
- **代码分离**: `lib/server/` 仅在服务端运行，`lib/` 可共享
- **现代工具链**: Vite + Tailwind CSS + Prisma

### 📂 核心目录说明

- `src/`: SvelteKit 主应用（前台页面、管理端、API 路由）
- `scripts/`: TypeScript 数据导入/清理工具（使用 `tsx` 运行）
- `prisma/`: Prisma 数据库配置、迁移和 SQLite 视图
- `data/`: 源 CSV 文件和本地 SQLite 数据库
- `demo/`: 原型（Express 服务器 + 地图 UI），非主线开发代码
- `docs/`: 设计文档和重构方案

## 快速开始

### 环境配置

1. 安装依赖：
   ```bash
   pnpm install
   ```

   也可使用 npm：`npm install`

2. 在项目根目录创建 `.env` 文件：

   ```bash
   DATABASE_URL="file:./data/gapmap.db"
   AMAP_KEY="your_amap_key"
   AMAP_SECURITY_CODE="your_amap_security_code"
   ```

### 数据库设置

```bash
# 应用 schema 和迁移
npx prisma migrate dev

# 创建 SQLite 视图
npx prisma db execute --file prisma/views.sql

# 检查数据库
npm run prisma:studio
```

### 数据导入

```bash
# 导入区域数据
npm run import:area

# 导入城市数据
npm run import

# （可选）更新城市地理信息
npx tsx scripts/update-city-geo.ts
```

### 运行演示

```bash
pnpm dev
```

访问 `http://127.0.0.1:5173/` 查看主应用。

可选：访问 `http://127.0.0.1:5173/admin` 查看管理端占位路由。

### （可选）运行 demo 原型

```bash
cd demo
npm install
npm start
```

访问 `http://localhost:3000` 查看 demo 原型。

## API 端点

### 🌐 已实现的 API

- `GET /api/health` - 健康检查
- `GET /api/cities` - 获取所有城市列表（使用 `cityRepository.findAll()`）
- `GET /api/config` - 获取应用配置（高德地图密钥等）

### 🚧 计划中的 API

- `GET /api/cities/search?q=关键词` - 搜索城市（使用 `cityRepository.findByName()`）
- `GET /api/cities/[id]` - 获取单个城市详情（使用 `cityRepository.findById()`）

### 📊 数据来源

- 城市数据：`v_tangping_cities` 视图（Prisma + SQLite）
- 配置数据：环境变量（`.env` 文件）

## 开发指南

### 🛠️ 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建

# 代码检查
npm run check         # TypeScript 类型检查
npm test             # 运行测试

# 数据库操作
npm run prisma:studio # 打开 Prisma Studio
npx prisma migrate dev # 运行数据库迁移
npx prisma db execute --file prisma/views.sql # 应用视图

# 数据导入
npm run import        # 导入城市数据
npm run import:area   # 导入区域数据
```

### 🏗️ 项目架构

本项目采用分层架构：

1. **表现层** (`src/routes/`) - SvelteKit 页面和 API 路由
2. **业务层** (`src/lib/api/`) - API 客户端封装
3. **数据层** (`src/lib/server/repositories/`) - 数据访问层
4. **持久层** (`prisma/` + `data/`) - Prisma ORM + SQLite

### 📝 开发流程

1. 修改 `prisma/schema.prisma` 定义数据模型
2. 运行 `npx prisma migrate dev` 生成迁移
3. 更新 `prisma/views.sql` 定义数据库视图
4. 在 `src/lib/server/repositories/` 实现数据访问
5. 在 `src/lib/api/` 创建 API 客户端
6. 在 `src/routes/` 创建页面和 API 路由
7. 运行 `npm run check` 验证类型安全

### 🔄 当前重构状态

项目正在进行 0-2 重构，已完成：

- ✅ 类型定义系统 (`src/lib/types/`)
- ✅ API 客户端封装 (`src/lib/api/`)
- ✅ Repository 数据访问层 (`src/lib/server/repositories/`)
- ✅ 部分 API 路由优化 (`/api/cities`, `/api/config`)

详细进度见：`docs/项目重构方案/REFACTORING_CHECKLIST.md`

## 编码规范

- 缩进：2 个空格
- 变量/函数命名：`camelCase`
- Prisma 模型：`PascalCase`
- 脚本文件：`kebab-case.ts`
- 使用单引号和分号

## 数据库更改

所有数据库更改应该通过修改 `prisma/schema.prisma` 进行。当视图列发生变化时，更新 `prisma/views.sql`。

## 提交规范

使用 Conventional Commits：
- `feat:` - 新功能
- `fix:` - 修复 bug
- `chore:` - 工具、依赖更新
- `docs:` - 文档更新

## License

MIT
