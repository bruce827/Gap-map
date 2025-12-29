/**
 * Gap-map CSV数据导入脚本
 * 将 cities_complete.csv 导入 SQLite 数据库
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================================
// 数据解析函数
// ============================================================

/**
 * 解析价格文本，提取数值
 * "约2200元/平方米" -> 2200
 * "约10万/套房" -> 100000
 * "约4.5万元/套" -> 45000
 * "约6000-11000元/平方米" -> 8500 (取中间值)
 */
function parsePrice(text: string): number | null {
  if (!text || text === '-' || text === '/' || text.trim() === '') return null;

  // 清理文本
  const cleaned = text.replace(/[约红]/g, '').trim();

  // 处理范围值: 4000-5500 或 6000-11000
  const rangeMatch = cleaned.match(/(\d+\.?\d*)[-~](\d+\.?\d*)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    const avg = (min + max) / 2;
    if (cleaned.includes('万')) return avg * 10000;
    return avg;
  }

  // 处理单值
  // 匹配: 数字 + 可选"万" + 可选"元" + "/" + 单位
  const patterns = [
    { regex: /(\d+\.?\d*)万/, multiplier: 10000 },
    { regex: /(\d+\.?\d*)元/, multiplier: 1 },
    { regex: /(\d+\.?\d*)/, multiplier: 1 },
  ];

  for (const { regex, multiplier } of patterns) {
    const match = cleaned.match(regex);
    if (match) {
      const value = parseFloat(match[1]) * multiplier;
      // 如果值太小且原文有"万"，则乘以10000
      if (value < 100 && text.includes('万')) {
        return value * 10000;
      }
      return value;
    }
  }

  return null;
}

/**
 * 解析百分比: "41.5%" -> 41.5
 */
function parsePercentage(text: string): number | null {
  if (!text || text === '-' || text === '/' || text.trim() === '') return null;
  const match = text.match(/(\d+\.?\d*)%?/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * 解析天数: "126天" -> 126
 */
function parseDays(text: string): number | null {
  if (!text || text === '-' || text === '/' || text.trim() === '') return null;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// ============================================================
// 枚举映射函数
// ============================================================

function mapHospitalLevel(raw: string): string {
  if (!raw || raw === '-' || raw.trim() === '') return 'UNKNOWN';
  if (raw.includes('三甲')) return 'LEVEL_3A';
  if (raw.includes('三乙')) return 'LEVEL_3B';
  if (raw.includes('三级')) return 'LEVEL_3';
  if (raw.includes('二甲')) return 'LEVEL_2A';
  return 'UNKNOWN';
}

function mapLatitudeType(raw: string): string {
  if (!raw || raw === '-' || raw === '/' || raw.trim() === '') return 'UNKNOWN';
  if (raw.includes('满洲冷城')) return 'MANZHOU_COLD';
  if (raw.includes('沿海冷城')) return 'COASTAL_COLD';
  if (raw.includes('内陆')) return 'INLAND';
  if (raw.includes('十分的暖')) return 'WARM';
  if (raw.includes('岛崛') || raw.includes('岛嶼')) return 'ISLAND';
  return 'UNKNOWN';
}

function mapHygieneLevel(raw: string): string {
  if (!raw || raw === '-' || raw.trim() === '') return 'NONE';
  if (raw.includes('国家卫生城市')) return 'NATIONAL';
  if (raw.includes('省级')) return 'PROVINCIAL';
  return 'NONE';
}

function mapConsumptionLevel(raw: string): string {
  if (!raw || raw === '-' || raw.trim() === '') return 'UNKNOWN';
  if (raw === '县') return 'LOW';
  if (raw === '覆盖') return 'MEDIUM';
  if (raw.includes('高')) return 'HIGH';
  return 'UNKNOWN';
}

function mapTransportCoverage(raw: string): string {
  if (!raw || raw === '-' || raw.trim() === '') return 'NONE';
  if (raw.includes('乡镇') || raw.includes('乡村')) return 'TOWN_LEVEL';
  if (raw === '覆盖') return 'FULL';
  if (raw.includes('部分')) return 'PARTIAL';
  return 'NONE';
}

// ============================================================
// 城市名称标准化函数
// ============================================================

function normalizeCityName(name: string): string {
  // 移除后缀，用于模糊匹配
  return name.replace(/[市区县州地区盟]/g, '').trim();
}

async function findCityByName(cityName: string, provinceName: string): Promise<{ id: string; name: string } | null> {
  // 先获取省份
  const province = await prisma.province.findFirst({
    where: {
      OR: [
        { name: { contains: provinceName } },
        { shortName: { contains: provinceName } },
      ]
    }
  });
  
  if (!province) return null;
  
  // 在该省份下查找城市
  const normalizedName = normalizeCityName(cityName);
  
  const city = await prisma.city.findFirst({
    where: {
      provinceId: province.id,
      OR: [
        { name: { contains: normalizedName } },
        { shortName: { contains: normalizedName } },
        { name: { contains: cityName } },
      ]
    }
  });
  
  return city;
}

// ============================================================
// 主导入函数
// ============================================================

async function importData() {
  console.log('🚀 开始导入躺平城市数据...\n');

  // 读取CSV文件
  const csvPath = path.join(__dirname, '../data/cities_complete.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  // 解析CSV - 使用宽松模式处理列数不一致
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  console.log(`📊 共读取 ${records.length} 条记录\n`);

  // 统计信息
  let matchedCities = 0;
  let unmatchedCities = 0;
  let tangpingCityCount = 0;
  let targetLocationCount = 0;
  const errors: string[] = [];
  const unmatchedList: string[] = [];

  // 缓存已匹配的城市
  const cityMatchCache = new Map<string, string | null>(); // key -> cityId

  console.log('🏙️  匹配城市并导入躺平数据...');

  for (const row of records) {
    const provinceName = row['省份']?.trim();
    let cityName = row['城市']?.trim() || '';
    
    if (!provinceName || !cityName) {
      errors.push(`空省份或城市: 序号 ${row['序号']}`);
      continue;
    }

    // 提取城市名（处理"城市/区县"格式）
    if (cityName.includes('/')) {
      cityName = cityName.split('/')[0];
    }

    // 缓存key
    const cacheKey = `${provinceName}-${cityName}`;
    
    // 查找匹配的城市
    let cityId = cityMatchCache.get(cacheKey);
    
    if (cityId === undefined) {
      // 未缓存，进行查找
      const matchedCity = await findCityByName(cityName, provinceName);
      if (matchedCity) {
        cityId = matchedCity.id;
        matchedCities++;
      } else {
        cityId = null;
        unmatchedCities++;
        unmatchedList.push(`${provinceName}-${cityName}`);
      }
      cityMatchCache.set(cacheKey, cityId);
    }

    if (!cityId) {
      continue; // 跳过未匹配的城市
    }

    // 检查是否已存在TangpingCity记录
    const existingTangping = await prisma.tangpingCity.findUnique({
      where: { cityId: cityId }
    });

    let tangpingCity;
    if (existingTangping) {
      tangpingCity = existingTangping;
    } else {
      // 创建TangpingCity
      tangpingCity = await prisma.tangpingCity.create({
        data: {
          cityId: cityId,
          districtNames: row['区县'] || null,
          rank: parseInt(row['序号']) || null,
        },
      });
      tangpingCityCount++;

      // 创建房产信息
      const avgPrice = row['平均二手房价格'] || '';
      const suitePrice = row['一套房价格'] || '';
      const lowPrice = row['低房价格'] || '';
      
      await prisma.cityHousing.create({
        data: {
          tangpingCityId: tangpingCity.id,
          avgSecondHandPrice: avgPrice || null,
          avgSecondHandPriceNum: parsePrice(avgPrice),
          suitePrice: suitePrice || null,
          suitePriceNum: parsePrice(suitePrice),
          lowPriceArea: row['低房价区域'] || null,
          lowPrice: lowPrice || null,
          lowPriceNum: parsePrice(lowPrice),
        },
      });

      // 5. 创建医疗信息
      const hospitalLevel = row['医院等级'] || '';
      await prisma.cityMedical.create({
        data: {
          tangpingCityId: tangpingCity.id,
          hospitalLevelRaw: hospitalLevel || null,
          hospitalLevel: mapHospitalLevel(hospitalLevel),
          hospitalName: row['医院名称'] || null,
        },
      });

      // 6. 创建气候信息
      const latitudeType = row['城市纬度类型'] || '';
      const greenCoverage = row['城市绿化覆盖率'] || '';
      const comfortDays = row['全年气温舒适天数'] || '';
      
      await prisma.cityClimate.create({
        data: {
          tangpingCityId: tangpingCity.id,
          latitudeTypeRaw: latitudeType || null,
          latitudeType: mapLatitudeType(latitudeType),
          comfortDays: parseDays(comfortDays),
          greenCoverageRate: parsePercentage(greenCoverage),
        },
      });

      // 7. 创建生活信息
      const hygieneLevel = row['环境卫生水平'] || '';
      const consumptionLevel = row['消费水平'] || '';
      
      await prisma.cityLiving.create({
        data: {
          tangpingCityId: tangpingCity.id,
          hygieneLevelRaw: hygieneLevel || null,
          hygieneLevel: mapHygieneLevel(hygieneLevel),
          consumptionLevelRaw: consumptionLevel || null,
          consumptionLevel: mapConsumptionLevel(consumptionLevel),
          activePopulation: row['活跃人数'] || null,
        },
      });

      // 8. 创建交通信息
      await prisma.cityTransport.create({
        data: {
          tangpingCityId: tangpingCity.id,
          airplaneRaw: row['飞机'] || null,
          airplane: mapTransportCoverage(row['飞机'] || ''),
          highSpeedRailRaw: row['高铁'] || null,
          highSpeedRail: mapTransportCoverage(row['高铁'] || ''),
          cityRailRaw: row['城铁'] || null,
          cityRail: mapTransportCoverage(row['城铁'] || ''),
          subwayBusRaw: row['地铁大巴'] || null,
          subwayBus: mapTransportCoverage(row['地铁大巴'] || ''),
          cityBusRaw: row['市内公交车'] || null,
          cityBus: mapTransportCoverage(row['市内公交车'] || ''),
          railwayRaw: row['铁路'] || null,
          railway: mapTransportCoverage(row['铁路'] || ''),
          hasAirport: (row['飞机'] || '').includes('覆盖'),
          hasHighSpeedRail: (row['高铁'] || '').includes('覆盖'),
        },
      });

    }

    // 创建目标地点（无论是新建还是已存在的TangpingCity）
    const targetLocation = row['躺平目标地点']?.trim();
    if (targetLocation && targetLocation !== '-' && targetLocation !== '/') {
      try {
        await prisma.targetLocation.create({
          data: {
            name: targetLocation,
            tangpingCityId: tangpingCity.id,
          },
        });
        targetLocationCount++;
      } catch (e) {
        // 忽略重复的目标地点
      }
    }
  }

  // 记录数据来源
  await prisma.dataSource.upsert({
    where: { id: 'tangping-csv' },
    update: {
      lastSyncAt: new Date(),
      syncStatus: 'success',
      recordCount: records.length,
    },
    create: {
      id: 'tangping-csv',
      name: 'cities_complete.csv',
      type: 'csv',
      description: '躺平城市初始数据 - 从图片OCR提取',
      lastSyncAt: new Date(),
      syncStatus: 'success',
      recordCount: records.length,
      version: '1.0',
    },
  });

  // 输出统计信息
  console.log(`\n📊 导入统计:`);
  console.log(`  - 匹配到标准城市: ${matchedCities}`);
  console.log(`  - 未匹配城市: ${unmatchedCities}`);
  console.log(`  - 创建躺平城市记录: ${tangpingCityCount}`);
  console.log(`  - 创建目标地点: ${targetLocationCount}`);

  if (unmatchedList.length > 0) {
    console.log(`\n⚠️  未匹配的城市 (前10个):`);
    unmatchedList.slice(0, 10).forEach((c) => console.log(`   - ${c}`));
    if (unmatchedList.length > 10) {
      console.log(`   ... 还有 ${unmatchedList.length - 10} 个`);
    }
  }

  if (errors.length > 0) {
    console.log(`\n❌ 导入错误:`);
    errors.slice(0, 10).forEach((e) => console.log(`   - ${e}`));
  }

  console.log('\n✨ 躺平城市数据导入完成！');
}

// 执行导入
importData()
  .catch((e) => {
    console.error('❌ 导入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
