# Gap-map

一个地理数据管理和可视化系统，用于区域、城市地理信息的处理、存储和展示。

## 项目结构

- `scripts/`: TypeScript 数据导入/清理工具（使用 `tsx` 运行）
- `prisma/`: Prisma 数据库配置（`schema.prisma`）、迁移和 SQLite 视图（`views.sql`）
- `data/`: 源 CSV 文件和本地 SQLite 数据库（`gapmap.db`）
- `demo/`: Express 服务器（`server.js`）+ 地图 UI（`index.html`）
- `docs/`: 设计文档和原始数据集

## 快速开始

### 环境配置

1. 安装依赖：
   ```bash
   npm install
   ```

2. 在项目根目录创建 `.env` 文件：
   ```
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
cd demo
npm install
npm start
```

访问 `http://localhost:3000` 查看地图应用。

## API 端点

- `GET /api/cities` - 获取城市列表（由 `v_tangping_cities` 视图支持）

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
