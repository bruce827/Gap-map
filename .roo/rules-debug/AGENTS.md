# Debug Mode Guidelines

## 环境配置问题
- **地图服务静默失败**: 缺少AMAP_KEY和AMAP_SECURITY_CODE时地图功能不会报错，仅显示空白页面，必须检查.env配置
- **数据库连接**: SQLite文件路径固定在`data/gapmap.db`，DATABASE_URL格式必须为`file:./data/gapmap.db`

## API调试要点
- **/api/cities端点**: 后端查询`v_tangping_cities`视图而非Prisma模型，视图重建后才能看到新数据
- **视图重建**: schema变更后需执行`npx prisma db execute --file prisma/views.sql`，否则API返回空数据

## 数据导入调试
- **城市匹配缓存**: `cityMatchCache`使用key格式`"省份-城市名"`，调试时清除缓存可重新匹配
- **CSV解析失败**: 使用`relax_column_count: true`但仍有列数不一致时，检查CSV文件的BOM编码问题
- **P2002错误**: 重复键错误会被忽略，如需调试具体错误需临时移除异常捕获

## 数据库检查
- **DataSource表**: 自动记录数据导入状态，查询`v_data_sources`视图可快速了解数据同步状态
- **枚举值验证**: 原始文本和枚举值双存储，检查两者一致性避免视图映射失败

## 验证流程
- **端点测试**: 无自动化测试时，通过`npm run import`→重建视图→访问`/api/cities`验证功能