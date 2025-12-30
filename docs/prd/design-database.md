# 数据库设计规范
 
 > 本文档定义了反卷躺平可视化系统的数据库结构、表关系和索引策略
 > 
 > 说明：本文档为 PostgreSQL 扩展方案（Phase 2+）参考；MVP 默认采用 Prisma + SQLite，且 MVP 阶段不计算“综合躺平指数/排名”。
 
## 📊 数据库选型

### 技术栈
- **数据库**：PostgreSQL 15+
- **ORM**：Prisma 5.0+
- **空间扩展**：PostGIS 3.0+
- **缓存**：Redis 7.0+

### 选型理由
- ✅ PostgreSQL：功能强大，支持JSONB、全文搜索
- ✅ PostGIS：专业的空间数据处理能力
- ✅ Prisma：类型安全，开发体验好
- ✅ Redis：高频访问数据缓存

---

## 🏗️ 核心数据表设计

### 1. 城市基础信息表 (`cities`)

```sql
CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) UNIQUE,
  
  -- 地理信息
  lng FLOAT NOT NULL,  -- 经度
  lat FLOAT NOT NULL,  -- 纬度
  province VARCHAR(50),  -- 省份
  province_code VARCHAR(20),  -- 省份代码
  city_level VARCHAR(20),  -- 城市等级：一线/新一线/二线...
  
  -- 人口数据
  population INTEGER,  -- 常住人口(万人)
  population_density FLOAT,  -- 人口密度(人/km²)
  
  -- 经济数据
  gdp BIGINT,  -- GDP(亿元)
  gdp_per_capita INTEGER,  -- 人均GDP(元)
  avg_income INTEGER,  -- 城镇居民收入(元/月)
  
  -- 生活成本
  house_price INTEGER,  -- 平均房价(元/㎡)
  avg_rent INTEGER,  -- 平均租金(元/月)
  cost_index FLOAT,  -- Numbeo生活成本指数
  
  -- 基础设施
  has_high_speed_rail BOOLEAN,  -- 是否有高铁站
  has_airport BOOLEAN,  -- 是否有机场
  has_subway BOOLEAN,  -- 是否有地铁
  subway_lines INTEGER,  -- 地铁线路数
  
  -- 医疗资源
  hospital_count INTEGER,  -- 医院总数
  tertiary_hospital_count INTEGER,  -- 三甲医院数量
  
  -- 教育资源
  university_count INTEGER,  -- 高校数量
  high_school_count INTEGER,  -- 重点高中数量
  
  -- 休闲设施
  park_count INTEGER,  -- 公园数量
  cafe_count INTEGER,  -- 咖啡馆数量
  gym_count INTEGER,  -- 健身房数量
  
  -- 躺平指数计算
  tangping_index FLOAT,  -- 综合躺平指数(0-10)
  tangping_index_calculation JSONB,  -- 指数计算明细
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  data_source VARCHAR(100),  -- 数据来源
  
  -- PostGIS空间字段
  geom GEOMETRY(Point, 4326),  -- WGS84坐标系
  
  -- 全文搜索向量
  search_vector TSVECTOR
);

-- 索引
CREATE INDEX idx_cities_geom ON cities USING GIST(geom);
CREATE INDEX idx_cities_province ON cities(province);
CREATE INDEX idx_cities_tangping ON cities(tangping_index DESC);
CREATE INDEX idx_cities_house_price ON cities(house_price);
CREATE INDEX idx_cities_search ON cities USING GIN(search_vector);

-- 全文搜索触发器
CREATE TRIGGER cities_search_update
BEFORE INSERT OR UPDATE ON cities
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.simple', name, province);
```

---

### 2. 房价历史表 (`house_price_history`)

```sql
CREATE TABLE house_price_history (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  
  district VARCHAR(100),  -- 区域/区县
  district_code VARCHAR(20),  -- 区域代码
  
  price INTEGER NOT NULL,  -- 均价(元/㎡)
  price_change FLOAT,  -- 环比变化(%)
  
  date DATE NOT NULL,  -- 数据日期
  data_source VARCHAR(50),  -- 数据来源：贝壳/链家/手动录入
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_house_price_city ON house_price_history(city_id);
CREATE INDEX idx_house_price_date ON house_price_history(date DESC);
CREATE INDEX idx_house_price_district ON house_price_history(district);

-- 分区表（按月分区）
CREATE TABLE house_price_history_2024_01 PARTITION OF house_price_history
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

### 3. 天气数据表 (`weather`)

```sql
CREATE TABLE weather (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,  -- 日期
  temp_max FLOAT,  -- 最高温度(°C)
  temp_min FLOAT,  -- 最低温度(°C)
  temp_avg FLOAT,  -- 平均温度
  
  weather TEXT,  -- 天气状况：晴/雨/多云...
  weather_code INTEGER,  -- 天气代码
  
  humidity INTEGER,  -- 湿度(%)
  wind_speed FLOAT,  -- 风速(km/h)
  wind_direction VARCHAR(10),  -- 风向
  
  aqi INTEGER,  -- 空气质量指数
  pm25 FLOAT,  -- PM2.5浓度
  pm10 FLOAT,  -- PM10浓度
  
  uv_index INTEGER,  -- 紫外线指数
  pressure FLOAT,  -- 大气压(hPa)
  visibility FLOAT,  -- 能见度(km)
  
  sunrise TIME,  -- 日出时间
  sunset TIME,  -- 日落时间
  
  data_source VARCHAR(50),  -- 数据来源：和风/OpenWeather
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_weather_city ON weather(city_id);
CREATE INDEX idx_weather_date ON weather(date DESC);
CREATE INDEX idx_weather_aqi ON weather(aqi);

-- 唯一约束，防止重复数据
CREATE UNIQUE INDEX idx_weather_unique 
ON weather(city_id, date, data_source);
```

---

### 4. 社交媒体评价表 (`social_media`)

```sql
CREATE TABLE social_media (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  
  platform VARCHAR(20) NOT NULL,  -- 平台：小红书/微博/知乎
  platform_id VARCHAR(100),  -- 平台原始ID
  
  type VARCHAR(20),  -- 类型：笔记/微博/问答
  
  title TEXT,  -- 标题
  content TEXT,  -- 内容（截取前500字）
  
  author VARCHAR(100),  -- 作者
  author_avatar VARCHAR(500),  -- 作者头像
  
  likes INTEGER DEFAULT 0,  -- 点赞数
  comments INTEGER DEFAULT 0,  -- 评论数
  shares INTEGER DEFAULT 0,  -- 分享数
  
  publish_time TIMESTAMP,  -- 发布时间
  url TEXT,  -- 原文链接
  
  cover_image VARCHAR(500),  -- 封面图
  images TEXT[],  -- 图片列表
  
  -- AI分析字段
  sentiment FLOAT,  -- 情感分数(-1到1)
  keywords TEXT[],  -- 关键词提取
  summary TEXT,  -- 摘要
  
  tags TEXT[],  -- 标签
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  data_source VARCHAR(50),  -- 采集来源
  
  -- 全文搜索向量
  search_vector TSVECTOR
);

-- 索引
CREATE INDEX idx_social_city ON social_media(city_id);
CREATE INDEX idx_social_platform ON social_media(platform);
CREATE INDEX idx_social_publish ON social_media(publish_time DESC);
CREATE INDEX idx_social_sentiment ON social_media(sentiment);
CREATE INDEX idx_social_search ON social_media USING GIN(search_vector);

-- 分区表（按月份区）
CREATE TABLE social_media_2024_12 PARTITION OF social_media
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- 全文搜索触发器
CREATE TRIGGER social_media_search_update
BEFORE INSERT OR UPDATE ON social_media
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.simple', title, content);
```

---

### 5. 交通路线表 (`transport_routes`)

```sql
CREATE TABLE transport_routes (
  id SERIAL PRIMARY KEY,
  
  from_city_id INTEGER NOT NULL REFERENCES cities(id),
  to_city_id INTEGER NOT NULL REFERENCES cities(id),
  
  type VARCHAR(20) NOT NULL,  -- 交通方式: train/flight/bus/drive
  
  duration INTEGER,  -- 耗时(分钟)
  distance INTEGER,  -- 距离(公里)
  
  price_min INTEGER,  -- 最低价格(元)
  price_max INTEGER,  -- 最高价格(元)
  price_avg INTEGER,  -- 平均价格(元)
  
  frequency INTEGER,  -- 每日班次
  
  departure_times TIME[],  -- 发车时间
  
  -- 路线详情(JSON)
  route_detail JSONB,  -- {
                        --   "stations": [...],
                        --   "path": [[lng, lat], ...]
                        -- }
  
  -- 舒适度评分
  comfort_score FLOAT,  -- 0-10分
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  data_source VARCHAR(50),  -- 数据来源: 12306/携程/高德
  
  -- 唯一约束
  UNIQUE(from_city_id, to_city_id, type)
);

-- 索引
CREATE INDEX idx_routes_from ON transport_routes(from_city_id);
CREATE INDEX idx_routes_to ON transport_routes(to_city_id);
CREATE INDEX idx_routes_type ON transport_routes(type);
CREATE INDEX idx_routes_price ON transport_routes(price_avg);
CREATE INDEX idx_routes_duration ON transport_routes(duration);
```

---

### 6. 用户收藏表 (`user_collections`)

```sql
CREATE TABLE user_collections (
  id SERIAL PRIMARY KEY,
  
  user_id INTEGER,  -- 用户ID (预留，目前用LocalStorage)
  city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  
  -- 收藏标签
  tags TEXT[],  -- 标签: ["备选", "已考察", "待深入了解"]
  
  -- 个人评分
  rating INTEGER,  -- 1-5星
  
  -- 个人笔记
  notes TEXT,
  
  -- 排序权重
  sort_order INTEGER DEFAULT 0,
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_collections_user ON user_collections(user_id);
CREATE INDEX idx_collections_city ON user_collections(city_id);
CREATE UNIQUE INDEX idx_collections_unique 
ON user_collections(user_id, city_id);
```

---

### 7. 爬虫日志表 (`scraper_logs`)

```sql
CREATE TABLE scraper_logs (
  id SERIAL PRIMARY KEY,
  
  scraper_name VARCHAR(100) NOT NULL,  -- 爬虫名称
  city_id INTEGER REFERENCES cities(id),  -- 关联城市
  
  status VARCHAR(20),  -- 状态: success/failure/running
  
  -- 执行信息
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration INTEGER,  -- 耗时(秒)
  
  -- 数据统计
  items_scraped INTEGER DEFAULT 0,  -- 采集数量
  pages_scraped INTEGER DEFAULT 0,  -- 访问页数
  
  -- 错误信息
  error_message TEXT,
  error_trace TEXT,
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 索引
  created_at DATE  -- 分区键
);

-- 索引
CREATE INDEX idx_logs_scraper ON scraper_logs(scraper_name);
CREATE INDEX idx_logs_status ON scraper_logs(status);
CREATE INDEX idx_logs_date ON scraper_logs(created_at DESC);

-- 分区表（按天分区）
CREATE TABLE scraper_logs_2024_12_26 PARTITION OF scraper_logs
FOR VALUES FROM ('2024-12-26') TO ('2024-12-27');
```

---

## 🔗 表关系图

```
cities (主表)
│
├─ house_price_history (一对多)
├─ weather (一对多)
├─ social_media (一对多)
├─ transport_routes (一对多，from_city_id)
├─ transport_routes (一对多，to_city_id)
├─ user_collections (一对多)
└─ scraper_logs (一对多，可选)
```

---

## 📈 索引策略

### 高频查询索引
```sql
-- 1. 城市列表查询（按躺平指数排序，Phase 2，非MVP）
CREATE INDEX idx_cities_tangping ON cities(tangping_index DESC, population DESC);

-- 2. 房价范围查询
CREATE INDEX idx_cities_price ON cities(house_price) WHERE house_price IS NOT NULL;

-- 3. 天气最新数据查询
CREATE INDEX idx_weather_latest ON weather(city_id, date DESC);

-- 4. 社交媒体情感分析
CREATE INDEX idx_social_sentiment ON social_media(city_id, sentiment DESC) WHERE sentiment IS NOT NULL;

-- 5. 路线查询（从A到B）
CREATE INDEX idx_routes_ab ON transport_routes(from_city_id, to_city_id, type);
```

---

## 🔄 数据更新策略

### 更新频率
| 数据表 | 更新频率 | 方式 |
|--------|---------|------|
| cities | 手动/月度 | 后台管理 |
| house_price_history | 月度 | 定时爬虫 |
| weather | 每日 | API自动更新 |
| social_media | 周/月 | 定时爬虫 |
| transport_routes | 季度 | 手动更新 |
| scraper_logs | 实时 | 自动记录 |

### 数据保留策略
```sql
-- 房价历史：保留24个月
ALTER TABLE house_price_history SET (timescaledb.compress_after = '12 months');

-- 天气数据：保留12个月
ALTER TABLE weather SET (timescaledb.compress_after = '6 months');

-- 爬虫日志：保留3个月
ALTER TABLE scraper_logs SET (timescaledb.compress_after = '1 month');
```

---

## 🔐 数据安全

### 访问控制
```sql
-- 只读用户（前端应用）
CREATE USER app_readonly WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE gapmap TO app_readonly;
GRANT USAGE ON SCHEMA public TO app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;

-- 读写用户（后端API）
CREATE USER app_readwrite WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE gapmap TO app_readwrite;
GRANT USAGE ON SCHEMA public TO app_readwrite;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_readwrite;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_readwrite;

-- 管理员（数据维护）
CREATE USER app_admin WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE gapmap TO app_admin;
```

### 数据备份
```bash
# 每日自动备份
0 2 * * * pg_dump gapmap > /backup/gapmap_$(date +\%Y\%m\%d).sql

# 备份保留30天
find /backup -name "gapmap_*.sql" -mtime +30 -delete
```

---

## 📊 性能优化

### 1. 分区表
- 时间序列数据使用分区（天气、房价历史、爬虫日志）
- 按月份区，自动清理旧数据

### 2. 物化视图
```sql
-- 城市统计物化视图
CREATE MATERIALIZED VIEW city_stats AS
SELECT
  c.id,
  c.name,
  c.tangping_index,
  COUNT(DISTINCT h.id) as price_records,
  COUNT(DISTINCT w.id) as weather_records,
  COUNT(DISTINCT s.id) as social_records,
  MAX(h.price) as max_house_price,
  MIN(h.price) as min_house_price,
  AVG(h.price) as avg_house_price
FROM cities c
LEFT JOIN house_price_history h ON c.id = h.city_id
LEFT JOIN weather w ON c.id = w.city_id
LEFT JOIN social_media s ON c.id = s.city_id
GROUP BY c.id, c.name, c.tangping_index;

-- 每小时刷新
CREATE OR REPLACE FUNCTION refresh_city_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY city_stats;
END;
$$ LANGUAGE plpgsql;

-- 定时任务
SELECT cron.schedule('refresh-stats', '0 * * * *', 'SELECT refresh_city_stats()');
```

### 3. 连接池配置
```javascript
// Prisma配置
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // 连接池配置
  connectionLimit: 10,  // 最大连接数
  poolTimeout: 10,      // 获取连接超时(秒)
});
```

---

## 📝 数据字典

### 城市等级 (city_level)
- `tier_1`：一线城市
- `tier_2`：新一线城市
- `tier_3`：二线城市
- `tier_4`：三线城市
- `tier_5`：四线及以下

### 数据来源 (data_source)
- `gaode`：高德地图
- `baidu`：百度地图
- `stats_gov`：国家统计局
- `ke_com`：贝壳找房
- `lianjia`：链家
- `qweather`：和风天气
- `openweather`：OpenWeather
- `manual`：手动录入

### 爬虫状态 (status)
- `running`：运行中
- `success`：成功
- `failure`：失败
- `timeout`：超时

---

## 🔍 查询示例

### 1. 查询躺平指数Top10城市（Phase 2，非MVP）
```sql
SELECT name, tangping_index, house_price, population
FROM cities
WHERE tangping_index IS NOT NULL
ORDER BY tangping_index DESC
LIMIT 10;
```

### 2. 查询城市房价趋势
```sql
SELECT 
  date,
  AVG(price) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM house_price_history
WHERE city_id = 1
  AND date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY date
ORDER BY date DESC;
```

### 3. 查询城市社交评价情感分析
```sql
SELECT
  platform,
  COUNT(*) as total,
  AVG(sentiment) as avg_sentiment,
  COUNT(CASE WHEN sentiment > 0 THEN 1 END) as positive_count,
  COUNT(CASE WHEN sentiment < 0 THEN 1 END) as negative_count
FROM social_media
WHERE city_id = 1
GROUP BY platform;
```

### 4. 查询最优交通路线
```sql
SELECT
  c1.name as from_city,
  c2.name as to_city,
  type,
  duration,
  price_avg,
  comfort_score
FROM transport_routes r
JOIN cities c1 ON r.from_city_id = c1.id
JOIN cities c2 ON r.to_city_id = c2.id
WHERE from_city_id = 1 AND to_city_id = 2
ORDER BY 
  CASE 
    WHEN :priority = 'time' THEN duration
    WHEN :priority = 'price' THEN price_avg
    WHEN :priority = 'comfort' THEN -comfort_score
  END;
```

---

## 📌 注意事项

### 数据质量
- ✅ 所有数值字段必须验证范围
- ✅ 经纬度必须在有效范围内
- ✅ 时间戳统一使用UTC存储
- ✅ 敏感数据（如用户位置）需加密

### 性能监控
- 监控慢查询（>1秒）
- 监控连接池使用率
- 监控磁盘空间
- 设置告警阈值

### 数据备份
- 每日全量备份
- 每小时增量备份
- 备份保留30天
- 定期测试恢复流程

---

*本文档由prd-product.md和prd-technical.md中的数据库章节整理而成*
*最后更新：2025-12-26*
