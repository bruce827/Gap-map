-- Gap-map 数据库视图
-- 将码表枚举值映射为中文可读格式

-- ============================================================
-- 1. 躺平城市主视图 (v_tangping_cities)
-- ============================================================
DROP VIEW IF EXISTS v_tangping_cities;
CREATE VIEW v_tangping_cities AS
SELECT 
  tc.id AS 躺平城市ID,
  tc.rank AS 排名,
  p.shortName AS 省份,
  c.name AS 城市,
  c.pinyin AS 城市拼音,
  tc.districtNames AS 区县,
  
  -- 房产信息
  h.avgSecondHandPrice AS 二手房价格_原始,
  h.avgSecondHandPriceNum AS 二手房价格_元,
  h.suitePrice AS 套房价格_原始,
  h.suitePriceNum AS 套房价格_元,
  h.lowPriceArea AS 低价区域,
  h.lowPrice AS 低价格_原始,
  h.lowPriceNum AS 低价格_元,
  
  -- 医疗信息 (码表映射)
  m.hospitalLevelRaw AS 医院等级_原始,
  CASE m.hospitalLevel
    WHEN 'LEVEL_3A' THEN '三甲医院'
    WHEN 'LEVEL_3B' THEN '三乙医院'
    WHEN 'LEVEL_3' THEN '三级医院'
    WHEN 'LEVEL_2A' THEN '二甲医院'
    ELSE '未知'
  END AS 医院等级,
  m.hospitalName AS 医院名称,
  
  -- 气候信息 (码表映射)
  cl.latitudeTypeRaw AS 纬度类型_原始,
  CASE cl.latitudeType
    WHEN 'MANZHOU_COLD' THEN '满洲冷城'
    WHEN 'COASTAL_COLD' THEN '沿海冷城'
    WHEN 'INLAND' THEN '内陆'
    WHEN 'WARM' THEN '十分的暖'
    WHEN 'ISLAND' THEN '岛崛区'
    ELSE '未知'
  END AS 纬度类型,
  cl.comfortDays AS 舒适天数,
  cl.greenCoverageRate AS 绿化覆盖率,
  
  -- 生活信息 (码表映射)
  l.hygieneLevelRaw AS 卫生等级_原始,
  CASE l.hygieneLevel
    WHEN 'NATIONAL' THEN '国家卫生城市'
    WHEN 'PROVINCIAL' THEN '省级卫生城市'
    ELSE '无评级'
  END AS 卫生等级,
  l.consumptionLevelRaw AS 消费水平_原始,
  CASE l.consumptionLevel
    WHEN 'HIGH' THEN '高'
    WHEN 'MEDIUM' THEN '中'
    WHEN 'LOW' THEN '低(县级)'
    ELSE '未知'
  END AS 消费水平,
  l.activePopulation AS 活跃人数,
  
  -- 交通信息 (码表映射)
  CASE t.airplane
    WHEN 'FULL' THEN '覆盖'
    WHEN 'TOWN_LEVEL' THEN '乡镇级'
    WHEN 'PARTIAL' THEN '部分'
    ELSE '-'
  END AS 飞机,
  CASE t.highSpeedRail
    WHEN 'FULL' THEN '覆盖'
    WHEN 'TOWN_LEVEL' THEN '乡镇级'
    WHEN 'PARTIAL' THEN '部分'
    ELSE '-'
  END AS 高铁,
  CASE t.cityRail
    WHEN 'FULL' THEN '覆盖'
    WHEN 'TOWN_LEVEL' THEN '乡镇级'
    WHEN 'PARTIAL' THEN '部分'
    ELSE '-'
  END AS 城铁,
  CASE t.subwayBus
    WHEN 'FULL' THEN '覆盖'
    WHEN 'TOWN_LEVEL' THEN '乡镇级'
    WHEN 'PARTIAL' THEN '部分'
    ELSE '-'
  END AS 地铁大巴,
  CASE t.cityBus
    WHEN 'FULL' THEN '覆盖'
    WHEN 'TOWN_LEVEL' THEN '乡镇级'
    WHEN 'PARTIAL' THEN '部分'
    ELSE '-'
  END AS 市内公交,
  CASE t.railway
    WHEN 'FULL' THEN '覆盖'
    WHEN 'TOWN_LEVEL' THEN '乡镇级'
    WHEN 'PARTIAL' THEN '部分'
    ELSE '-'
  END AS 铁路,
  
  -- 地理信息
  c.lat AS 纬度,
  c.lng AS 经度,
  
  -- 标准行政代码
  c.id AS 城市代码,
  p.id AS 省份代码

FROM TangpingCity tc
JOIN City c ON tc.cityId = c.id
JOIN Province p ON c.provinceId = p.id
LEFT JOIN CityHousing h ON tc.id = h.tangpingCityId
LEFT JOIN CityMedical m ON tc.id = m.tangpingCityId
LEFT JOIN CityClimate cl ON tc.id = cl.tangpingCityId
LEFT JOIN CityLiving l ON tc.id = l.tangpingCityId
LEFT JOIN CityTransport t ON tc.id = t.tangpingCityId
ORDER BY tc.rank;


-- ============================================================
-- 2. 简洁版躺平城市视图 (v_tangping_simple)
-- ============================================================
DROP VIEW IF EXISTS v_tangping_simple;
CREATE VIEW v_tangping_simple AS
SELECT 
  tc.rank AS 排名,
  p.shortName AS 省份,
  c.name AS 城市,
  ROUND(h.avgSecondHandPriceNum / 10000, 1) || '万' AS 套房价格,
  CASE m.hospitalLevel
    WHEN 'LEVEL_3A' THEN '三甲'
    WHEN 'LEVEL_3B' THEN '三乙'
    WHEN 'LEVEL_3' THEN '三级'
    WHEN 'LEVEL_2A' THEN '二甲'
    ELSE '-'
  END AS 医院,
  cl.comfortDays || '天' AS 舒适天数,
  CASE l.consumptionLevel
    WHEN 'HIGH' THEN '高'
    WHEN 'MEDIUM' THEN '中'
    WHEN 'LOW' THEN '低'
    ELSE '-'
  END AS 消费,
  CASE 
    WHEN t.hasHighSpeedRail = 1 THEN '✓'
    ELSE '-'
  END AS 高铁,
  CASE 
    WHEN t.hasAirport = 1 THEN '✓'
    ELSE '-'
  END AS 机场
FROM TangpingCity tc
JOIN City c ON tc.cityId = c.id
JOIN Province p ON c.provinceId = p.id
LEFT JOIN CityHousing h ON tc.id = h.tangpingCityId
LEFT JOIN CityMedical m ON tc.id = m.tangpingCityId
LEFT JOIN CityClimate cl ON tc.id = cl.tangpingCityId
LEFT JOIN CityLiving l ON tc.id = l.tangpingCityId
LEFT JOIN CityTransport t ON tc.id = t.tangpingCityId
ORDER BY tc.rank;


-- ============================================================
-- 3. 目标地点视图 (v_target_locations)
-- ============================================================
DROP VIEW IF EXISTS v_target_locations;
CREATE VIEW v_target_locations AS
SELECT 
  tl.id AS 地点ID,
  p.shortName AS 省份,
  c.name AS 城市,
  tl.name AS 目标地点,
  tl.avgPrice AS 平均房价,
  tl.rentPrice AS 租金,
  tl.description AS 描述
FROM TargetLocation tl
JOIN TangpingCity tc ON tl.tangpingCityId = tc.id
JOIN City c ON tc.cityId = c.id
JOIN Province p ON c.provinceId = p.id
ORDER BY p.id, c.name, tl.name;


-- ============================================================
-- 4. 省份统计视图 (v_province_stats)
-- ============================================================
DROP VIEW IF EXISTS v_province_stats;
CREATE VIEW v_province_stats AS
SELECT 
  p.shortName AS 省份,
  COUNT(DISTINCT c.id) AS 城市总数,
  COUNT(DISTINCT d.id) AS 区县总数,
  COUNT(DISTINCT tc.id) AS 躺平城市数,
  COUNT(DISTINCT tl.id) AS 目标地点数,
  ROUND(AVG(h.avgSecondHandPriceNum), 0) AS 平均套房价格,
  ROUND(AVG(cl.comfortDays), 0) AS 平均舒适天数
FROM Province p
LEFT JOIN City c ON p.id = c.provinceId
LEFT JOIN District d ON c.id = d.cityId
LEFT JOIN TangpingCity tc ON c.id = tc.cityId
LEFT JOIN TargetLocation tl ON tc.id = tl.tangpingCityId
LEFT JOIN CityHousing h ON tc.id = h.tangpingCityId
LEFT JOIN CityClimate cl ON tc.id = cl.tangpingCityId
GROUP BY p.id
HAVING 躺平城市数 > 0
ORDER BY 躺平城市数 DESC;


-- ============================================================
-- 5. 低房价城市排行视图 (v_low_price_ranking)
-- ============================================================
DROP VIEW IF EXISTS v_low_price_ranking;
CREATE VIEW v_low_price_ranking AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY h.avgSecondHandPriceNum ASC) AS 排名,
  p.shortName AS 省份,
  c.name AS 城市,
  h.avgSecondHandPriceNum AS 套房价格_元,
  ROUND(h.avgSecondHandPriceNum / 10000, 1) || '万' AS 套房价格,
  h.lowPriceArea AS 低价区域,
  h.lowPriceNum AS 最低价格_元,
  CASE m.hospitalLevel
    WHEN 'LEVEL_3A' THEN '三甲'
    WHEN 'LEVEL_3B' THEN '三乙'
    WHEN 'LEVEL_3' THEN '三级'
    ELSE '-'
  END AS 医院等级,
  cl.comfortDays AS 舒适天数
FROM TangpingCity tc
JOIN City c ON tc.cityId = c.id
JOIN Province p ON c.provinceId = p.id
LEFT JOIN CityHousing h ON tc.id = h.tangpingCityId
LEFT JOIN CityMedical m ON tc.id = m.tangpingCityId
LEFT JOIN CityClimate cl ON tc.id = cl.tangpingCityId
WHERE h.avgSecondHandPriceNum IS NOT NULL
ORDER BY h.avgSecondHandPriceNum ASC;


-- ============================================================
-- 6. 高舒适度城市视图 (v_comfortable_cities)
-- ============================================================
DROP VIEW IF EXISTS v_comfortable_cities;
CREATE VIEW v_comfortable_cities AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY cl.comfortDays DESC) AS 排名,
  p.shortName AS 省份,
  c.name AS 城市,
  cl.comfortDays AS 舒适天数,
  CASE cl.latitudeType
    WHEN 'MANZHOU_COLD' THEN '满洲冷城'
    WHEN 'COASTAL_COLD' THEN '沿海冷城'
    WHEN 'INLAND' THEN '内陆'
    WHEN 'WARM' THEN '十分的暖'
    WHEN 'ISLAND' THEN '岛崛区'
    ELSE '未知'
  END AS 气候类型,
  cl.greenCoverageRate || '%' AS 绿化率,
  ROUND(h.avgSecondHandPriceNum / 10000, 1) || '万' AS 套房价格
FROM TangpingCity tc
JOIN City c ON tc.cityId = c.id
JOIN Province p ON c.provinceId = p.id
LEFT JOIN CityClimate cl ON tc.id = cl.tangpingCityId
LEFT JOIN CityHousing h ON tc.id = h.tangpingCityId
WHERE cl.comfortDays IS NOT NULL
ORDER BY cl.comfortDays DESC;


-- ============================================================
-- 7. 全量城市视图 (v_all_cities) - 包含未收录为躺平城市的
-- ============================================================
DROP VIEW IF EXISTS v_all_cities;
CREATE VIEW v_all_cities AS
SELECT 
  c.id AS 城市代码,
  p.shortName AS 省份,
  c.name AS 城市,
  c.pinyin AS 拼音,
  CASE WHEN tc.id IS NOT NULL THEN '是' ELSE '否' END AS 已收录躺平,
  (SELECT COUNT(*) FROM District WHERE cityId = c.id) AS 区县数
FROM City c
JOIN Province p ON c.provinceId = p.id
LEFT JOIN TangpingCity tc ON c.id = tc.cityId
ORDER BY p.id, c.id;


-- ============================================================
-- 8. 数据来源视图 (v_data_sources)
-- ============================================================
DROP VIEW IF EXISTS v_data_sources;
CREATE VIEW v_data_sources AS
SELECT 
  name AS 数据源名称,
  type AS 类型,
  description AS 描述,
  recordCount AS 记录数,
  datetime(lastSyncAt, 'localtime') AS 最后同步时间,
  syncStatus AS 同步状态,
  version AS 版本
FROM DataSource
ORDER BY lastSyncAt DESC;
