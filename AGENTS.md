# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## 数据库架构非标准模式
- **双字段枚举模式**: 所有枚举值同时存储原始文本(如"三甲医院")和解析后的枚举值(如"LEVEL_3A")，在views.sql中映射为中文可读格式
- **价格解析复杂性**: `parsePrice()`函数处理范围值取中间值，万单位自动转换，4000-5500→4750，"约10万"→100000
- **视图依赖**: 业务逻辑主要在SQL视图而非Prisma模型中，必须在schema变更后执行`npx prisma db execute --file prisma/views.sql`

## 数据导入关键细节
- **城市匹配机制**: `normalizeCityName()`移除后缀进行模糊匹配，缓存机制(cityMatchCache)提升性能
- **CSV解析特殊**: 使用`relax_column_count: true`处理不一致列数，BOM处理避免编码问题
- **错误容忍**: 忽略P2002重复键错误，某些区县跳过(直辖市市辖区情况)

## 环境配置必需项
- **地图服务**: 缺少AMAP_KEY和AMAP_SECURITY_CODE会导致地图功能静默失败，.env必需配置
- **数据库路径**: SQLite文件固定在`data/gapmap.db`，相对路径引用

## 开发验证流程
- **端点验证**: `/api/cities`后端为`v_tangping_cities`视图，非Prisma直接查询
- **测试依赖**: 无自动化测试，通过运行import脚本+检查demo端点验证功能
- **数据源追踪**: 自动记录DataSource表，同步状态和记录数

## 代码约定(非标准)
- **脚本命名**: scripts/目录强制kebab-case.ts(SvelteKit默认camelCase)
- **Prisma错误处理**: 特定忽略P2002(唯一约束违反)，其他错误正常抛出
- **中文API**: SvelteKit路由和视图使用中文列名，非标准但符合业务需求
