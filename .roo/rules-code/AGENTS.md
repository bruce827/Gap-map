# Code Mode Guidelines

## 数据导入脚本模式
- **tsx执行**: 所有scripts必须通过`tsx`运行，不能直接用node或ts-node
- **kebab-case命名**: scripts/目录强制kebab-case.ts，与SvelteKit默认camelCase相反
- **相对路径引用**: 脚本内部使用`path.join(__dirname, '../data/')`引用data目录

## 数据库操作模式
- **P2002错误处理**: Prisma唯一约束冲突(P2002)必须忽略，其他错误正常抛出
- **事务模式**: 数据导入使用upsert模式，数据库清理保持业务数据完整性
- **视图重建**: schema变更后必须执行`npx prisma db execute --file prisma/views.sql`

## 价格解析工具
- **parsePrice()复杂性**: 4000-5500→4750(范围取中间)，万单位自动转换，容错"约"字
- **范围值处理**: 正则匹配`(\d+\.?\d*)[-~](\d+\.?\d*)`计算平均值
- **单位转换**: "约10万"→100000，必须处理万单位换算

## CSV处理模式
- **BOM处理**: 必须移除UTF-8 BOM避免编码问题
- **relax_column_count**: 使用`relax_column_count: true`处理不一致列数
- **城市名标准化**: `normalizeCityName()`移除"市区县州地区盟"后缀进行模糊匹配

## 缓存机制
- **cityMatchCache**: 城市匹配使用Map缓存，key格式`"省份-城市名"`，避免重复查询