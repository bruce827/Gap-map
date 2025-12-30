# Gap-map 数据结构设计文档

## 一、设计原则

1. **兼容性**: 完整保留现有CSV的22个字段
2. **可扩展性**: 预留字段扩展空间，支持未来新增数据
3. **规范化**: 拆分相关实体，减少数据冗余，使用码表管理枚举值
4. **标准化**: 引用国家标准行政区划数据，确保地理数据准确
5. **查询友好**: 便于按区域、价格、气候等多维度筛选

---

## 二、整体架构

### 2.1 数据分层

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: 标准行政区划 (来自开源数据)                      │
│  - Province / City / District                           │
│  - 带行政代码、经纬度、拼音、边界                          │
│  - 数据来源: xiangyuecn/AreaCity-JsSpider-StatsGov      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 2: 码表 (枚举值管理)                               │
│  - 医院等级 / 纬度类型 / 交通覆盖 / 卫生等级 / 消费水平   │
│  - 保证数据一致性，支持国际化                             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 3: 躺平城市业务数据                                │
│  - TangpingCity (关联到标准City)                        │
│  - Housing / Medical / Climate / Living / Transport     │
│  - TargetLocation (具体躺平地点)                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 4: 实时/动态数据                                   │
│  - Weather / SocialNote / News                          │
│  - 定时更新的数据                                        │
└─────────────────────────────────────────────────────────┘
```

### 2.2 数据分类

| 分类 | 说明 | 字段来源 |
|------|------|----------|
| 位置信息 | 省份、城市、区县、经纬度 | 标准行政区划数据 |
| 房产信息 | 房价、租金、低价区域 | CSV |
| 医疗信息 | 医院等级、医院名称 | CSV + 码表 |
| 气候信息 | 纬度类型、舒适天数、绿化率 | CSV + 码表 |
| 生活信息 | 消费水平、环境卫生 | CSV + 码表 |
| 交通信息 | 6种交通方式覆盖情况 | CSV + 码表 |
| 社区信息 | 活跃人数（躺平社区） | CSV |

---

## 三、标准行政区划数据

### 3.1 数据来源

**推荐使用**: [xiangyuecn/AreaCity-JsSpider-StatsGov](https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov)

该项目特点：
- 数据来源：民政部 + 国家统计局 + 高德/腾讯地图
- 包含：省/市/区县/乡镇 四级数据
- 附带：行政代码、经纬度坐标、拼音、行政边界
- 格式：CSV / JSON / SQL / GeoJSON / SHP
- 更新：持续维护，2025年最新数据

### 3.2 行政区划表结构

```prisma
// ============================================================
// 标准行政区划表 (从开源数据导入，只读)
// ============================================================

// 省份表
model Province {
  id            String   @id           // 使用行政代码作为ID (如: 230000)
  name          String   @unique       // 省份名称 (黑龙江省)
  shortName     String?                // 简称 (黑龙江)
  pinyin        String?                // 拼音 (heilongjiang)
  pinyinShort   String?                // 拼音首字母 (hlj)
  
  // 地理信息
  lat           Float?                 // 省会纬度
  lng           Float?                 // 省会经度
  
  // 关联
  cities        City[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// 城市表 (地级市/自治州/地区)
model City {
  id            String   @id           // 行政代码 (如: 230400 鹤岗市)
  name          String                 // 城市名称 (鹤岗市)
  shortName     String?                // 简称 (鹤岗)
  pinyin        String?                // 拼音
  pinyinShort   String?                // 拼音首字母
  
  // 归属
  provinceId    String
  province      Province @relation(fields: [provinceId], references: [id])
  
  // 地理信息
  lat           Float                  // 纬度
  lng           Float                  // 经度
  area          Float?                 // 面积 (km²)
  
  // 行政信息
  levelCode     String?                // 级别代码: 1-地级市, 2-县级市, 3-自治州...
  level         CityLevel?             // 级别枚举 (关联码表)
  areaCode      String?                // 电话区号 (0468)
  zipCode       String?                // 邮编 (154100)
  
  // 关联
  districts     District[]
  tangpingCity  TangpingCity?          // 躺平城市扩展数据
  weather       Weather[]
  socialNotes   SocialNote[]
  news          News[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([provinceId, name])
  @@index([provinceId])
  @@index([pinyin])
}

// 区县表
model District {
  id            String   @id           // 行政代码 (如: 230403 兴安区)
  name          String                 // 区县名称
  shortName     String?                // 简称
  pinyin        String?                // 拼音
  
  // 归属
  cityId        String
  city          City     @relation(fields: [cityId], references: [id], onDelete: Cascade)
  
  // 地理信息
  lat           Float?
  lng           Float?
  
  // 关联
  targetLocations TargetLocation[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([cityId])
  @@index([pinyin])
}
```

---

## 四、码表设计

### 4.1 码表总览

从CSV原始数据中提取的枚举值：

| 码表名 | 说明 | 枚举值数量 |
|--------|------|------------|
| CityLevel | 城市行政级别 | 6 |
| HospitalLevel | 医院等级 | 4 |
| LatitudeType | 城市纬度/气候类型 | 6 |
| HygieneLevel | 环境卫生等级 | 3 |
| TransportCoverage | 交通覆盖程度 | 4 |
| ConsumptionLevel | 消费水平 | 4 |

### 4.2 码表定义 (Prisma Enum)

```prisma
// ============================================================
// 码表定义 (枚举)
// ============================================================

// 城市行政级别
enum CityLevel {
  MUNICIPALITY          // 直辖市
  SUB_PROVINCIAL        // 副省级市
  PREFECTURE            // 地级市
  COUNTY_LEVEL          // 县级市
  AUTONOMOUS_PREFECTURE // 自治州
  LEAGUE                // 盟 (内蒙古)
}

// 医院等级
enum HospitalLevel {
  LEVEL_3A              // 三甲医院
  LEVEL_3B              // 三乙医院
  LEVEL_3               // 三级医院 (未评甲乙)
  LEVEL_2A              // 二甲医院
  UNKNOWN               // 未知
}

// 城市纬度/气候类型
enum LatitudeType {
  MANZHOU_COLD          // 满洲冷城 (东北严寒区)
  COASTAL_COLD          // 沿海冷城 (沿海寒冷区)
  INLAND                // 内陆
  WARM                  // 十分的暖 (温暖区)
  ISLAND                // 岛崛区
  UNKNOWN               // 未知
}

// 环境卫生等级
enum HygieneLevel {
  NATIONAL              // 国家卫生城市
  PROVINCIAL            // 省级卫生城市
  NONE                  // 无评级
}

// 交通覆盖程度
enum TransportCoverage {
  FULL                  // 覆盖 (完全覆盖)
  TOWN_LEVEL            // 覆盖到乡镇级别或乡村
  PARTIAL               // 部分覆盖
  NONE                  // 无覆盖 / -
}

// 消费水平
enum ConsumptionLevel {
  HIGH                  // 高
  MEDIUM                // 中
  LOW                   // 低 (县级)
  UNKNOWN               // 未知
}
```

### 4.3 码表映射 (CSV值 → 枚举)

```typescript
// 医院等级映射
const hospitalLevelMap: Record<string, HospitalLevel> = {
  '三甲医院': 'LEVEL_3A',
  '三甲': 'LEVEL_3A',
  '三乙医院': 'LEVEL_3B',
  '三级': 'LEVEL_3',
  '三级医院': 'LEVEL_3',
  '二甲医院': 'LEVEL_2A',
  '-': 'UNKNOWN',
  '': 'UNKNOWN',
};

// 纬度类型映射
const latitudeTypeMap: Record<string, LatitudeType> = {
  '满洲冷城': 'MANZHOU_COLD',
  '沿海冷城': 'COASTAL_COLD',
  '内陆': 'INLAND',
  '十分的暖': 'WARM',
  '岛崛区': 'ISLAND',
  '-': 'UNKNOWN',
  '': 'UNKNOWN',
};

// 交通覆盖映射
const transportCoverageMap: Record<string, TransportCoverage> = {
  '覆盖': 'FULL',
  '覆盖到乡镇级别或乡村': 'TOWN_LEVEL',
  '覆盖到乡镇级别': 'TOWN_LEVEL',
  '部分覆盖': 'PARTIAL',
  '-': 'NONE',
  '': 'NONE',
};

// 消费水平映射
const consumptionLevelMap: Record<string, ConsumptionLevel> = {
  '县': 'LOW',
  '覆盖': 'MEDIUM',
  '-': 'UNKNOWN',
  '': 'UNKNOWN',
};
```

---

## 五、业务数据表结构 (Prisma Schema)

### 5.1 躺平城市扩展表

```prisma
// ============================================================
// 躺平城市扩展表 (业务核心)
// ============================================================

// 躺平城市 (关联标准City，一对一)
model TangpingCity {
  id            String   @id @default(cuid())
  
  // 关联标准城市
  cityId        String   @unique
  city          City     @relation(fields: [cityId], references: [id])
  
  // 基础指标
  isFocus       Boolean  @default(false)  // 是否重点关注
  tangpingScore Float?                    // 躺平指数 (0-100)（Phase 2，非MVP）
  rank          Int?                      // 躺平排名（Phase 2，非MVP）
  
  // 城市描述与标签
  description   String?                   // 城市描述/躺平亮点
  tags          String[]                  // 标签数组: ["低房价", "三甲医院", "高铁直达"]
  
  // 原始CSV区县字段 (可能包含多个区县)
  districtNames String?                   // 原始区县文本
  
  // 关联业务数据
  housing       CityHousing?
  medical       CityMedical?
  climate       CityClimate?
  living        CityLiving?
  transport     CityTransport?
  economy       CityEconomy?              // 经济数据 (新增)
  targetLocations TargetLocation[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// 躺平目标地点 (具体小区/区域)
model TargetLocation {
  id            String   @id @default(cuid())
  name          String                    // 地点名称 (如: 峰台小区)
  
  // 关联
  tangpingCityId String
  tangpingCity  TangpingCity @relation(fields: [tangpingCityId], references: [id], onDelete: Cascade)
  
  districtId    String?                   // 可选关联到具体区县
  district      District? @relation(fields: [districtId], references: [id], onDelete: SetNull)
  
  // 坐标
  lat           Float?
  lng           Float?
  
  // 房产信息
  avgPrice      Float?                    // 该地点平均房价 (元/平)
  rentPrice     Float?                    // 该地点租金 (元/月)
  
  description   String?                   // 描述
  tags          String[]                  // 标签
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([tangpingCityId])
  @@index([districtId])
}
```

### 5.2 经济数据表 (新增)

```prisma
// 城市经济数据 (一对一关联TangpingCity)
model CityEconomy {
  id                    String   @id @default(cuid())
  tangpingCityId        String   @unique
  tangpingCity          TangpingCity @relation(fields: [tangpingCityId], references: [id], onDelete: Cascade)
  
  // 人口数据
  population            Float?                 // 人口 (万)
  populationUrban       Float?                 // 城镇人口 (万)
  
  // 经济指标
  gdp                   Float?                 // GDP (亿元)
  gdpPerCapita          Float?                 // 人均GDP (元)
  disposableIncome      Float?                 // 人均可支配收入 (元)
  avgSalary             Float?                 // 平均工资 (元)
  
  // 就业数据
  unemploymentRate      Float?                 // 失业率 (%)
  
  // 数据来源与时间
  dataYear              Int?                   // 数据年份
  dataSource            String?                // 数据来源
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 5.3 房产信息表

```prisma
// 城市房产信息 (一对一关联TangpingCity)
model CityHousing {
  id                    String   @id @default(cuid())
  tangpingCityId        String   @unique
  tangpingCity          TangpingCity @relation(fields: [tangpingCityId], references: [id], onDelete: Cascade)
  
  // === 来自CSV的原始字段 ===
  avgSecondHandPrice    String?  // 平均二手房价格 (原始文本: "约2200元/平方米")
  avgSecondHandPriceNum Float?   // 解析后数值 (2200)
  
  suitePrice            String?  // 一套房价格 (原始文本: "约10万/套房")
  suitePriceNum         Float?   // 解析后数值 (100000)
  
  lowPriceArea          String?  // 低房价区域 (如: 峰台小区)
  lowPrice              String?  // 低房价格 (原始文本: "约1200元/平")
  lowPriceNum           Float?   // 解析后数值 (1200)
  
  // === 扩展字段 ===
  rentPriceRange        String?  // 租金范围 (如: "700-1300元/月")
  rentPriceMin          Float?   // 租金最低
  rentPriceMax          Float?   // 租金最高
  
  priceYoY              Float?   // 房价同比变化率 (%)
  priceMoM              Float?   // 房价环比变化率 (%)
  
  dataSource            String?  // 数据来源
  dataDate              DateTime? // 数据日期
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 5.4 医疗教育信息表

```prisma
// 城市医疗教育信息 (一对一关联TangpingCity)
model CityMedical {
  id                    String   @id @default(cuid())
  tangpingCityId        String   @unique
  tangpingCity          TangpingCity @relation(fields: [tangpingCityId], references: [id], onDelete: Cascade)
  
  // === 来自CSV的原始字段 ===
  hospitalLevelRaw      String?        // 原始文本 (三甲医院/三级等)
  hospitalLevel         HospitalLevel? // 枚举值 (关联码表)
  hospitalName          String?        // 医院名称
  
  // === 医疗扩展字段 ===
  hospitalCount3A       Int?           // 三甲医院数量
  hospitalCount         Int?           // 医院总数
  bedsPer1000           Float?         // 每千人床位数
  doctorsPer1000        Float?         // 每千人医生数
  
  // === 教育扩展字段 ===
  universities          Int?           // 高校数量
  vocationalSchools     Int?           // 职业院校数量
  primarySchools        Int?           // 小学数量
  middleSchools         Int?           // 中学数量
  
  // 医院列表 (JSON格式)
  hospitalList          Json?          // [{name, level, lat, lng, address}]
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 5.5 气候环境表

```prisma
// 城市气候信息 (一对一关联TangpingCity)
model CityClimate {
  id                    String   @id @default(cuid())
  tangpingCityId        String   @unique
  tangpingCity          TangpingCity @relation(fields: [tangpingCityId], references: [id], onDelete: Cascade)
  
  // === 来自CSV的原始字段 ===
  latitudeTypeRaw       String?        // 原始文本 (满洲冷城/沿海冷城等)
  latitudeType          LatitudeType?  // 枚举值 (关联码表)
  comfortDays           Int?           // 全年气温舒适天数
  greenCoverageRate     Float?         // 城市绿化覆盖率 (%)
  
  // === 扩展字段 ===
  avgTempYear           Float?         // 年平均气温 (℃)
  avgTempSummer         Float?         // 夏季平均气温 (℃)
  avgTempWinter         Float?         // 冬季平均气温 (℃)
  precipitation         Float?         // 年降水量 (mm)
  sunshineHours         Float?         // 年日照时数 (小时)
  
  avgAqi                Float?         // 年平均AQI
  goodAirDays           Int?           // 优良天气天数
  
  climateDescription    String?        // 气候特点描述
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 5.6 生活信息表

```prisma
// 城市生活信息 (一对一关联TangpingCity)
model CityLiving {
  id                    String   @id @default(cuid())
  tangpingCityId        String   @unique
  tangpingCity          TangpingCity @relation(fields: [tangpingCityId], references: [id], onDelete: Cascade)
  
  // === 来自CSV的原始字段 ===
  hygieneLevelRaw       String?           // 原始文本 (国家卫生城市等)
  hygieneLevel          HygieneLevel?     // 枚举值 (关联码表)
  consumptionLevelRaw   String?           // 原始文本 (县/覆盖等)
  consumptionLevel      ConsumptionLevel? // 枚举值 (关联码表)
  activePopulation      String?           // 活跃人数 (原始文本)
  
  // === 扩展字段 ===
  // 消费指数
  cpi                   Float?            // 消费价格指数
  foodCostDaily         Float?            // 日均餐饮消费 (元)
  
  // 社区活跃度
  tangpingGroupCount    Int?              // 躺平群组数量
  tangpingPopulation    Int?              // 躺平社区活跃人数
  
  // 生活便利度
  supermarketCount      Int?              // 超市数量
  restaurantCount       Int?              // 餐饮店数量
  cafeCount             Int?              // 咖啡馆数量
  parkCount             Int?              // 公园数量
  gymCount              Int?              // 健身房数量
  libraryCount          Int?              // 图书馆数量
  cinemaCount           Int?              // 电影院数量
  
  // 便利设施 (JSON格式)
  poiData               Json?             // 各类POI详情
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 5.7 交通信息表

```prisma
// 城市交通信息 (一对一关联TangpingCity)
model CityTransport {
  id                    String   @id @default(cuid())
  tangpingCityId        String   @unique
  tangpingCity          TangpingCity @relation(fields: [tangpingCityId], references: [id], onDelete: Cascade)
  
  // === 来自CSV的原始字段 (6种交通方式，使用枚举) ===
  airplaneRaw           String?             // 原始值
  airplane              TransportCoverage?  // 飞机覆盖
  highSpeedRailRaw      String?
  highSpeedRail         TransportCoverage?  // 高铁覆盖
  cityRailRaw           String?
  cityRail              TransportCoverage?  // 城铁覆盖
  subwayBusRaw          String?
  subwayBus             TransportCoverage?  // 地铁大巴覆盖
  cityBusRaw            String?
  cityBus               TransportCoverage?  // 市内公交车覆盖
  railwayRaw            String?
  railway               TransportCoverage?  // 铁路覆盖
  
  // === 扩展字段 (布尔值，便于快速查询) ===
  hasAirport            Boolean  @default(false)
  hasHighSpeedRail      Boolean  @default(false)
  hasCityRail           Boolean  @default(false)
  hasSubway             Boolean  @default(false)
  
  // 交通便利度评分
  transportScore        Float?              // 交通评分 (0-100)
  
  // 详细信息
  nearestAirport        String?             // 最近机场名称
  airportDistance       Float?              // 距最近机场距离 (km)
  
  nearestHighSpeedStation String?           // 最近高铁站
  highSpeedStationDistance Float?           // 距最近高铁站距离 (km)
  
  // 可达性 (JSON格式: 到主要城市的耗时)
  accessibilityData     Json?               // {北京: "5h", 上海: "8h", ...}
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

---

## 六、实时数据表

```prisma
// ============================================================
// 实时/动态数据表
// ============================================================

// 天气数据 (实时更新，关联标准City)
model Weather {
  id          String   @id @default(cuid())
  cityId      String                    // 关联标准城市
  city        City     @relation(fields: [cityId], references: [id], onDelete: Cascade)
  
  temp        Float                     // 温度
  weather     String                    // 天气状况
  humidity    Int                       // 湿度
  windSpeed   Float                     // 风速
  aqi         Int?                      // 空气质量指数
  aqiLevel    String?                   // 空气质量等级
  
  forecast    Json?                     // 7天预报
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([cityId])
}

// 社交媒体评价 (关联标准City)
model SocialNote {
  id          String   @id @default(cuid())
  cityId      String
  city        City     @relation(fields: [cityId], references: [id], onDelete: Cascade)
  
  platform    String                    // xiaohongshu/weibo/zhihu/douyin
  title       String
  content     String?
  author      String?
  authorAvatar String?
  
  likes       Int      @default(0)
  comments    Int      @default(0)
  shares      Int      @default(0)
  
  sentiment   String?                   // positive/neutral/negative
  sentimentScore Float?                 // -1 到 1
  
  url         String?
  coverImage  String?
  
  publishedAt DateTime?
  scrapedAt   DateTime @default(now())
  
  @@index([cityId, platform])
  @@index([publishedAt])
}

// 新闻 (关联标准City)
model News {
  id          String   @id @default(cuid())
  cityId      String?
  city        City?    @relation(fields: [cityId], references: [id], onDelete: Cascade)
  
  title       String
  summary     String?
  url         String
  source      String
  
  publishedAt DateTime
  scrapedAt   DateTime @default(now())
  
  @@index([cityId])
  @@index([publishedAt])
}
```

---

## 七、辅助表

```prisma
// ============================================================
// 辅助表
// ============================================================

// 数据来源记录
model DataSource {
  id          String   @id @default(cuid())
  name        String                    // 数据源名称
  type        String                    // csv/api/scraper/opendata
  url         String?                   // 数据源URL
  description String?                   // 描述
  
  lastSyncAt  DateTime?
  syncStatus  String?                   // success/failed
  recordCount Int?                      // 记录数
  version     String?                   // 数据版本
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 爬虫日志
model ScraperLog {
  id          String   @id @default(cuid())
  scraper     String
  status      String                    // success/failed
  cityName    String?
  
  itemsCount  Int      @default(0)
  duration    Int?                      // 耗时(秒)
  error       String?
  screenshot  String?
  
  createdAt   DateTime @default(now())
  
  @@index([scraper, createdAt])
}

// 用户收藏
model Favorite {
  id        String   @id @default(cuid())
  userId    String
  cityId    String                      // 关联标准City
  note      String?
  tags      String[]
  
  createdAt DateTime @default(now())
  
  @@unique([userId, cityId])
}
```

---

## 八、字段映射表

### 8.1 CSV字段 → 数据库字段

| 序号 | CSV字段 | 目标表 | 目标字段 | 码表 | 说明 |
|------|---------|--------|----------|------|------|
| 1 | 序号 | - | - | - | 不存储，自动生成ID |
| 2 | 省份 | Province | name | - | 匹配标准行政区划 |
| 3 | 城市 | City | name | - | 匹配标准行政区划 |
| 4 | 区县 | TangpingCity | districtNames | - | 存储原始文本 |
| 5 | 躺平目标地点 | TargetLocation | name | - | 具体小区/区域 |
| 6 | 平均二手房价格 | CityHousing | avgSecondHandPrice/Num | - | 原始+解析 |
| 7 | 一套房价格 | CityHousing | suitePrice/Num | - | 原始+解析 |
| 8 | 低房价区域 | CityHousing | lowPriceArea | - | |
| 9 | 低房价格 | CityHousing | lowPrice/Num | - | 原始+解析 |
| 10 | 医院等级 | CityMedical | hospitalLevelRaw/Level | HospitalLevel | 原始+枚举 |
| 11 | 医院名称 | CityMedical | hospitalName | - | |
| 12 | 城市纬度类型 | CityClimate | latitudeTypeRaw/Type | LatitudeType | 原始+枚举 |
| 13 | 全年气温舒适天数 | CityClimate | comfortDays | - | |
| 14 | 城市绿化覆盖率 | CityClimate | greenCoverageRate | - | |
| 15 | 环境卫生水平 | CityLiving | hygieneLevelRaw/Level | HygieneLevel | 原始+枚举 |
| 16 | 消费水平 | CityLiving | consumptionLevelRaw/Level | ConsumptionLevel | 原始+枚举 |
| 17 | 活跃人数 | CityLiving | activePopulation | - | |
| 18 | 飞机 | CityTransport | airplaneRaw/airplane | TransportCoverage | 原始+枚举 |
| 19 | 高铁 | CityTransport | highSpeedRailRaw/Rail | TransportCoverage | 原始+枚举 |
| 20 | 城铁 | CityTransport | cityRailRaw/Rail | TransportCoverage | 原始+枚举 |
| 21 | 地铁大巴 | CityTransport | subwayBusRaw/Bus | TransportCoverage | 原始+枚举 |
| 22 | 市内公交车 | CityTransport | cityBusRaw/Bus | TransportCoverage | 原始+枚举 |
| 23 | 铁路 | CityTransport | railwayRaw/railway | TransportCoverage | 原始+枚举 |

### 8.2 城市名称匹配规则

```typescript
// CSV中的城市名需要匹配到标准行政区划
// 匹配策略:

async function matchCity(csvCityName: string, csvProvinceName: string) {
  // 1. 精确匹配
  let city = await prisma.city.findFirst({
    where: {
      name: csvCityName,
      province: { name: { contains: csvProvinceName } }
    }
  });
  
  // 2. 模糊匹配 (去掉"市""州"等后缀)
  if (!city) {
    const shortName = csvCityName.replace(/[市州地区盟]/g, '');
    city = await prisma.city.findFirst({
      where: {
        OR: [
          { name: { contains: shortName } },
          { shortName: shortName }
        ],
        province: { name: { contains: csvProvinceName } }
      }
    });
  }
  
  // 3. 拼音匹配 (处理OCR错误)
  // ...
  
  return city;
}
```

---

## 九、扩展字段规划

### 9.1 地理扩展 (标准行政区划已包含)

| 字段 | 类型 | 说明 | 数据来源 |
|------|------|------|----------|
| lat/lng | Float | 经纬度坐标 | 标准行政区划数据 ✅ |
| altitude | Float | 海拔 | 高德/百度 |
| cityBoundary | Json | 城市边界多边形 | xiangyuecn项目 ✅ |
| areaCode | String | 电话区号 | 标准行政区划数据 ✅ |
| zipCode | String | 邮编 | 标准行政区划数据 ✅ |

### 9.2 经济扩展

| 字段 | 类型 | 说明 | 数据来源 |
|------|------|------|----------|
| gdp | Float | GDP | 统计局 |
| gdpPerCapita | Float | 人均GDP | 统计局 |
| avgSalary | Float | 平均工资 | 统计局/招聘网站 |
| unemploymentRate | Float | 失业率 | 统计局 |

### 9.3 生活品质扩展

| 字段 | 类型 | 说明 | 数据来源 |
|------|------|------|----------|
| educationResources | Json | 教育资源 | POI |
| culturalFacilities | Json | 文化设施 | POI |
| leisureFacilities | Json | 休闲设施 | POI |
| internetSpeed | Float | 网络带宽 | 运营商 |

### 9.4 社区扩展

| 字段 | 类型 | 说明 | 数据来源 |
|------|------|------|----------|
| qqGroupCount | Int | QQ群数量 | 爬虫 |
| wechatGroupCount | Int | 微信群数量 | 用户提交 |
| forumPostCount | Int | 论坛帖子数 | 爬虫 |
| sentimentAvg | Float | 平均情绪值 | NLP分析 |

---

## 十、数据导入策略

### 10.1 初始化流程

```
阶段1: 导入标准行政区划 (一次性)
┌─────────────────────────────────────────┐
│ 1. 下载 xiangyuecn/AreaCity 数据        │
│ 2. 导入 Province 表 (34条)              │
│ 3. 导入 City 表 (~340条地级市)          │
│ 4. 导入 District 表 (~2800条区县)       │
└─────────────────────────────────────────┘
                    ↓
阶段2: 导入躺平城市CSV数据
┌─────────────────────────────────────────┐
│ 1. 读取 cities_complete.csv            │
│ 2. 匹配省份 → 标准Province              │
│ 3. 匹配城市 → 标准City                  │
│ 4. 创建 TangpingCity 扩展记录           │
│ 5. 创建关联表 (Housing/Medical/...)     │
│ 6. 解析文本 → 填充数值和枚举            │
│ 7. 创建 TargetLocation 记录             │
└─────────────────────────────────────────┘
                    ↓
阶段3: 持续更新
┌─────────────────────────────────────────┐
│ - 天气数据 (每日)                        │
│ - 社交媒体 (每周)                        │
│ - 房价数据 (每月)                        │
└─────────────────────────────────────────┘
```

### 10.2 数据清洗规则

```typescript
// ============================================================
// 数值解析函数
// ============================================================

// 价格解析
function parsePrice(text: string): number | null {
  if (!text || text === '-') return null;
  
  // "约2200元/平方米" -> 2200
  // "约10万/套房" -> 100000
  // "约4.5万元/套" -> 45000
  // "约6000-11000元/平方米" -> 8500 (取中间值)
  
  // 处理范围值
  const rangeMatch = text.match(/(\d+\.?\d*)[-~](\d+\.?\d*)/);  
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    const avg = (min + max) / 2;
    if (text.includes('万')) return avg * 10000;
    return avg;
  }
  
  // 处理单值
  const patterns = [
    { regex: /约?(\d+\.?\d*)万.*\/套/, multiplier: 10000 },
    { regex: /约?(\d+\.?\d*)元\/平/, multiplier: 1 },
    { regex: /(\d+\.?\d*)元\/m²/, multiplier: 1 },
  ];
  
  for (const { regex, multiplier } of patterns) {
    const match = text.match(regex);
    if (match) return parseFloat(match[1]) * multiplier;
  }
  
  return null;
}

// 百分比解析
function parsePercentage(text: string): number | null {
  if (!text || text === '-') return null;
  const match = text.match(/(\d+\.?\d*)%/);
  return match ? parseFloat(match[1]) : null;
}

// 天数解析
function parseDays(text: string): number | null {
  if (!text || text === '-') return null;
  const match = text.match(/(\d+)天/);
  return match ? parseInt(match[1]) : null;
}

// ============================================================
// 枚举映射函数
// ============================================================

function mapHospitalLevel(raw: string): HospitalLevel {
  const map: Record<string, HospitalLevel> = {
    '三甲医院': 'LEVEL_3A',
    '三甲': 'LEVEL_3A',
    '三乙医院': 'LEVEL_3B',
    '三级': 'LEVEL_3',
  };
  return map[raw] || 'UNKNOWN';
}

function mapTransportCoverage(raw: string): TransportCoverage {
  if (!raw || raw === '-') return 'NONE';
  if (raw.includes('乡镇')) return 'TOWN_LEVEL';
  if (raw === '覆盖') return 'FULL';
  return 'PARTIAL';
}
```

---

## 十一、API查询示例

### 11.1 获取躺平城市列表 (带筛选)

```typescript
// 获取所有低房价躺平城市
async function getLowPriceTangpingCities(maxPrice: number) {
  return prisma.tangpingCity.findMany({
    where: {
      housing: {
        avgSecondHandPriceNum: { lte: maxPrice }
      }
    },
    include: {
      city: {
        include: { province: true }
      },
      housing: true,
      climate: true,
      transport: true
    },
    orderBy: {
      housing: { avgSecondHandPriceNum: 'asc' }
    }
  });
}
```

### 11.2 多维度筛选

```typescript
interface TangpingCityFilter {
  maxHousePrice?: number;
  minComfortDays?: number;
  hasHighSpeedRail?: boolean;
  hospitalLevel?: HospitalLevel;
  latitudeType?: LatitudeType;
  provinces?: string[];
}

async function filterTangpingCities(filter: TangpingCityFilter) {
  return prisma.tangpingCity.findMany({
    where: {
      AND: [
        filter.maxHousePrice ? {
          housing: { avgSecondHandPriceNum: { lte: filter.maxHousePrice } }
        } : {},
        filter.minComfortDays ? {
          climate: { comfortDays: { gte: filter.minComfortDays } }
        } : {},
        filter.hasHighSpeedRail ? {
          transport: { hasHighSpeedRail: true }
        } : {},
        filter.hospitalLevel ? {
          medical: { hospitalLevel: filter.hospitalLevel }
        } : {},
        filter.latitudeType ? {
          climate: { latitudeType: filter.latitudeType }
        } : {},
        filter.provinces?.length ? {
          city: { province: { name: { in: filter.provinces } } }
        } : {}
      ]
    },
    include: {
      city: {
        include: { province: true }
      },
      housing: true,
      climate: true,
      medical: true,
      transport: true,
      living: true,
      targetLocations: true
    }
  });
}
```

### 11.3 按码表枚举统计

```typescript
// 按气候类型统计城市数量
async function countByLatitudeType() {
  return prisma.cityClimate.groupBy({
    by: ['latitudeType'],
    _count: { latitudeType: true },
    where: { latitudeType: { not: null } }
  });
}

// 按医院等级统计
async function countByHospitalLevel() {
  return prisma.cityMedical.groupBy({
    by: ['hospitalLevel'],
    _count: { hospitalLevel: true },
    where: { hospitalLevel: { not: null } }
  });
}
```

---

## 十二、数据库视图 (SQLite)

为便于直接查看数据，已创建8个数据库视图，码表值已映射为中文。

### 12.1 视图清单

| 视图名 | 说明 | 用途 |
|--------|------|------|
| `v_tangping_simple` | 简洁版躺平城市 | 快速浏览核心数据 |
| `v_tangping_cities` | 完整版躺平城市 | 查看所有字段详情 |
| `v_low_price_ranking` | 低房价排行 | 按房价从低到高排序 |
| `v_comfortable_cities` | 高舒适度城市 | 按舒适天数排序 |
| `v_province_stats` | 省份统计 | 各省汇总数据 |
| `v_target_locations` | 目标地点 | 具体躺平小区/地点 |
| `v_all_cities` | 全量城市 | 393个标准城市（含是否已收录） |
| `v_data_sources` | 数据来源 | 导入记录追踪 |

### 12.2 视图使用示例

```bash
# 查看简洁版数据
sqlite3 -header -column data/gapmap.db "SELECT * FROM v_tangping_simple;"

# 查看低房价排行前20
sqlite3 -header -column data/gapmap.db "SELECT * FROM v_low_price_ranking LIMIT 20;"

# 按省份筛选
sqlite3 -header -column data/gapmap.db "SELECT * FROM v_tangping_simple WHERE 省份='云南';"

# 查看省份统计
sqlite3 -header -column data/gapmap.db "SELECT * FROM v_province_stats;"
```

### 12.3 码表映射规则

视图中已将以下枚举值映射为中文：

**医院等级 (hospitalLevel)**:
- `LEVEL_3A` → 三甲医院
- `LEVEL_3B` → 三乙医院
- `LEVEL_3` → 三级医院
- `LEVEL_2A` → 二甲医院
- `UNKNOWN` → 未知

**纬度类型 (latitudeType)**:
- `MANZHOU_COLD` → 满洲冷城
- `COASTAL_COLD` → 沿海冷城
- `INLAND` → 内陆
- `WARM` → 十分的暖
- `ISLAND` → 岛崛区

**卫生等级 (hygieneLevel)**:
- `NATIONAL` → 国家卫生城市
- `PROVINCIAL` → 省级卫生城市
- `NONE` → 无评级

**消费水平 (consumptionLevel)**:
- `HIGH` → 高
- `MEDIUM` → 中
- `LOW` → 低(县级)

**交通覆盖 (TransportCoverage)**:
- `FULL` → 覆盖
- `TOWN_LEVEL` → 乡镇级
- `PARTIAL` → 部分
- `NONE` → -

### 12.4 视图文件位置

视图定义SQL文件: `prisma/views.sql`

重新创建视图:
```bash
sqlite3 data/gapmap.db < prisma/views.sql
```

---

## 十三、未来扩展方向

1. **POI数据**: 获取周边设施详情 (经纬度已有)
2. **房价趋势**: 接入房价历史数据，支持趋势图
3. **气象数据**: 接入实时天气API
4. **社交媒体**: 小红书/微博躺平相关内容
5. **用户评价**: 支持用户提交城市评价
6. **多语言**: 支持国际化 (针对数字游民)
7. **地图边界**: 使用 GeoJSON 数据展示城市边界

---

## 十四、技术选型 (已确认)

| 组件 | 选择 | 理由 |
|------|------|------|
| 项目名称 | **Gap-map** | - |
| 前端框架 | SvelteKit | 轻量、性能好、全栈支持 |
| UI组件库 | **Flowbite Svelte** | 组件丰富、拿来即用 |
| ORM | Prisma | 类型安全，迁移方便 |
| 开发数据库 | **SQLite** | 零配置、单文件、本地开发方便 |
| 生产数据库 | **PostgreSQL (Supabase)** | 免费500MB，Vercel兼容 |
| 地图服务 | 高德地图 | 国内数据全，API稳定 |
| 天气API | 高德天气(主) + 和风天气(生活指数) | 互补 |
| AI识别API | 预留配置，支持Claude/GPT-4切换 | 灵活 |
| 部署平台 | **Vercel** | 免费、自动CI/CD |
| 行政区划数据 | xiangyuecn/AreaCity-JsSpider-StatsGov | 最全最新 |
| 后台认证 | 无 | 个人使用，不需要 |

> 注意: SQLite不支持Prisma的enum类型，枚举值将以String存储，应用层做校验

---

## 十五、PRD对比说明

本数据结构设计完全覆盖并扩展了原 PRD 中 `三、数据库设计` 部分的所有内容：

| PRD原设计 | 本设计覆盖情况 | 改进点 |
|-----------|------------------|--------|
| City表(单表) | Province + City + District + TangpingCity | 拆分为标准行政区划+业务扩展 |
| name/province | Province.name, City.name | 引用开源标准数据 |
| lat/lng | City.lat/lng | 来自标准行政区划，自带坐标 |
| level | CityLevel枚举 | 升级为码表 |
| area/population | City.area, CityEconomy.population | 拆分到不同表 |
| gdp/income | CityEconomy表 | 新增独立经济数据表 |
| housePrice/rent | CityHousing表 | 更详细的房产字段 |
| hasHighSpeedRail等 | CityTransport表 | 6种交通方式+枚举码表 |
| hospitals | CityMedical表 | 增加医院等级码表 |
| universities | CityMedical.universities | 新增教育字段 |
| cafes/parks/cinemas | CityLiving表 | POI数据+更多设施 |
| description/tags | TangpingCity.description/tags | 已包含 |
| isFocus | TangpingCity.isFocus | 已包含 |
| Weather表 | Weather表 | 完全一致 |
| SocialNote表 | SocialNote表 | 增加sentiment情感分析字段 |
| News表 | News表 | 完全一致 |
| ScraperLog表 | ScraperLog表 | 完全一致 |
| Favorite表 | Favorite表 | 完全一致 |

**结论**: PRD中的数据库设计部分可以移除，统一使用本文档作为数据结构设计的唯一来源。

---

## 十六、附录：ER图

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Province   │──1:N─│     City     │──1:N─│   District   │
│ (标准行政区划) │      │ (标准行政区划) │      │ (标准行政区划) │
└──────────────┘      └──────┬───────┘      └──────────────┘
                             │
                           1:1
                             │
                      ┌──────▼───────┐
                      │ TangpingCity │
                      │  (躺平城市)   │
                      └──────┬───────┘
                             │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
   1:1                 1:1                 1:N
     │                   │                   │
┌────▼─────┐    ┌──────▼──────┐    ┌──────▼──────┐
│CityEconomy│    │ CityHousing │    │TargetLocation│
│ (经济数据) │    │  (房产信息)  │    │ (躺平地点)   │
└───────────┘    └─────────────┘    └─────────────┘
     │                   │
   1:1                 1:1
     │                   │
┌────▼─────┐    ┌──────▼──────┐
│CityMedical│    │ CityClimate │
│(医疗教育)  │    │  (气候信息)  │
└───────────┘    └─────────────┘
     │                   │
   1:1                 1:1
     │                   │
┌────▼─────┐    ┌──────▼──────┐
│ CityLiving│    │CityTransport│
│ (生活信息) │    │  (交通信息)  │
└───────────┘    └─────────────┘

┌─────────────────────────────────────────┐
│              码表 (Enum)                 │
├─────────────────────────────────────────┤
│ CityLevel      │ 城市行政级别            │
│ HospitalLevel  │ 医院等级               │
│ LatitudeType   │ 纬度/气候类型           │
│ HygieneLevel   │ 环境卫生等级            │
│ TransportCoverage │ 交通覆盖程度         │
│ ConsumptionLevel  │ 消费水平             │
└─────────────────────────────────────────┘
```

---

*文档版本: 2.1*
*创建日期: 2025-12-17*
*更新内容: 增加码表设计、标准行政区划引用、PRD对比说明、经济数据表、教育字段*
*状态: 已审核，替代PRD中的数据库设计*
