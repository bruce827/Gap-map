# Ask Mode Guidelines

## 文档结构理解
- **中文列名系统**: 数据库视图和API使用中文列名，非标准但符合业务需求，避免使用英文解释
- **数据源分离**: `初始数据/`包含原始图片和设计文档，`data/`包含处理后的CSV和数据库文件
- **双系统架构**: SvelteKit主线应用 + `demo/`目录的Express原型，需明确询问用户关注哪个系统

## 项目背景上下文
- **躺平城市主题**: 系统专注分析适合"躺平"生活方式的城市，包含房价、医疗、气候等维度
- **OCR数据源**: 初始数据来自图片OCR提取，存在数据质量问题，需要模糊匹配和清洗
- **双字段枚举**: 原始文本和解析枚举值同时存储，在views.sql中实现中文映射

## API端点现状
- **/api/cities**: 基于`v_tangping_cities`视图，当前实现不完整
- **管理端路由**: `/admin`路由存在但功能未实现
- **demo端点**: `demo/server.js`提供独立原型系统，与主线分离

## 技术选择说明
- **SQLite vs PostgreSQL**: 使用SQLite因数据量小且部署简单，views.sql提供复杂查询
- **tsx vs ts-node**: 项目强制使用tsx执行TypeScript脚本，兼容性更好
- **kebab-case脚本**: 与SvelteKit默认camelCase相反，scripts/目录强制此约定