# Architect Mode Guidelines

## 数据库架构决策
- **视图驱动架构**: 业务逻辑主要在SQL视图实现而非Prisma模型，API直接查询视图获取中文列名数据
- **双字段枚举策略**: 所有枚举同时存储原始文本和解析值，在views.sql中映射为中文可读格式
- **SQLite选择**: 因数据量小且部署简单，牺牲PostgreSQL的高级特性换取开发效率

## 数据匹配与缓存策略
- **城市匹配算法**: `normalizeCityName()`移除行政后缀进行模糊匹配，使用`cityMatchCache`缓存已匹配结果
- **范围值处理**: `parsePrice()`对价格范围取中间值(4000-5500→4750)，万单位自动转换
- **错误容忍设计**: P2002重复键错误被忽略，某些区县跳过处理(直辖市市辖区情况)

## 技术选型约束
- **tsx强制执行**: 所有脚本必须通过tsx运行，替代ts-node确保兼容性
- **kebab-case脚本**: 与SvelteKit默认camelCase相反，scripts/目录强制此命名约定
- **地图服务依赖**: 高德地图服务必需配置AMAP_KEY和AMAP_SECURITY_CODE，缺失时静默失败

## 开发验证流程
- **端点验证**: `/api/cities`后端查询`v_tangping_cities`视图，需要schema变更后重建视图
- **数据源追踪**: 自动记录DataSource表和同步状态，缺乏自动化测试需手动验证流程
- **渐进式开发**: demo/目录作为独立原型，与SvelteKit主线分离开发

## 性能与维护考量
- **缓存机制**: 城市匹配使用Map缓存避免重复查询，key格式`"省份-城市名"`
- **CSV处理优化**: 使用`relax_column_count: true`处理不一致列数，BOM处理避免编码问题
- **视图重建要求**: schema变更后必须执行`npx prisma db execute --file prisma/views.sql`保持视图同步