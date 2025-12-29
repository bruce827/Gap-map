/**
 * Gap-map 标准行政区划数据导入脚本
 * 数据来源: xiangyuecn/AreaCity-JsSpider-StatsGov
 * 导入省/市/区县三级数据
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface AreaRecord {
  id: string;        // 短ID (如: 11, 1101, 110101)
  pid: string;       // 父ID
  deep: string;      // 层级: 0=省, 1=市, 2=区县
  name: string;      // 简称 (北京)
  pinyin_prefix: string; // 拼音首字母
  pinyin: string;    // 拼音
  ext_id: string;    // 完整行政代码 (110000000000)
  ext_name: string;  // 完整名称 (北京市)
}

// 提取6位行政代码
function getAreaCode(extId: string): string {
  // ext_id是12位，取前6位作为标准行政代码
  return extId.substring(0, 6);
}

async function importAreaData() {
  console.log('🚀 开始导入标准行政区划数据...\n');

  // 读取CSV文件
  const csvPath = path.join(__dirname, '../data/area_level3.csv');
  let csvContent = fs.readFileSync(csvPath, 'utf-8');
  // 移除BOM
  if (csvContent.charCodeAt(0) === 0xFEFF) {
    csvContent = csvContent.slice(1);
  }

  // 解析CSV
  const records: AreaRecord[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📊 共读取 ${records.length} 条记录\n`);

  // 分类数据
  const provinces: AreaRecord[] = [];
  const cities: AreaRecord[] = [];
  const districts: AreaRecord[] = [];

  for (const record of records) {
    switch (record.deep) {
      case '0':
        provinces.push(record);
        break;
      case '1':
        cities.push(record);
        break;
      case '2':
        districts.push(record);
        break;
    }
  }

  console.log(`  📍 省份: ${provinces.length} 条`);
  console.log(`  🏙️  城市: ${cities.length} 条`);
  console.log(`  🏘️  区县: ${districts.length} 条\n`);

  // 构建ID映射 (短ID -> 记录)
  const provinceMap = new Map<string, AreaRecord>();
  const cityMap = new Map<string, AreaRecord>();
  // 短ID -> 6位行政代码映射
  const provinceIdToCode = new Map<string, string>();
  const cityIdToCode = new Map<string, string>();

  for (const p of provinces) {
    provinceMap.set(p.id, p);
    provinceIdToCode.set(p.id, getAreaCode(p.ext_id));
  }
  
  
  for (const c of cities) {
    cityMap.set(c.id, c);
    cityIdToCode.set(c.id, getAreaCode(c.ext_id));
  }

  // 1. 清空现有行政区划数据 (保留业务数据)
  console.log('🗑️  清理现有行政区划数据...');
  
  // 先获取现有的TangpingCity关联的cityId
  const existingTangpingCities = await prisma.tangpingCity.findMany({
    select: { cityId: true }
  });
  const tangpingCityIds = new Set(existingTangpingCities.map(tc => tc.cityId));
  
  // 删除未被TangpingCity引用的城市和区县
  await prisma.district.deleteMany({});
  await prisma.city.deleteMany({
    where: {
      id: { notIn: Array.from(tangpingCityIds) }
    }
  });
  // 删除所有省份（会通过级联保留被引用的城市）
  // 注意：由于外键约束，只能删除没有被引用的省份
  
  console.log('  ✅ 清理完成\n');

  // 2. 导入省份
  console.log('📍 导入省份...');
  let provinceCount = 0;
  
  for (const p of provinces) {
    const areaCode = getAreaCode(p.ext_id);
    try {
      await prisma.province.upsert({
        where: { id: areaCode },
        update: {
          name: p.ext_name,
          shortName: p.name,
          pinyin: p.pinyin.replace(/ /g, ''),
        },
        create: {
          id: areaCode,
          name: p.ext_name,
          shortName: p.name,
          pinyin: p.pinyin.replace(/ /g, ''),
        },
      });
      provinceCount++;
    } catch (e: any) {
      console.error(`  ❌ 省份导入失败: ${p.ext_name} - ${e.message}`);
    }
  }
  console.log(`  ✅ 导入了 ${provinceCount} 个省份\n`);

  // 3. 导入城市
  console.log('🏙️  导入城市...');
  let cityCount = 0;
  let cityUpdated = 0;
  
  for (const c of cities) {
    const areaCode = getAreaCode(c.ext_id);
    // 使用短ID映射查找父省份的行政代码
    const provinceCode = provinceIdToCode.get(c.pid);
    
    if (!provinceCode) {
      console.error(`  ⚠️  城市 ${c.ext_name} 找不到父省份 (pid: ${c.pid})`);
      continue;
    }
    
    try {
      // 检查是否已存在（可能是之前导入的躺平城市）
      const existing = await prisma.city.findUnique({
        where: { id: areaCode }
      });
      
      if (existing) {
        // 更新现有城市的标准信息
        await prisma.city.update({
          where: { id: areaCode },
          data: {
            name: c.ext_name,
            shortName: c.name,
            pinyin: c.pinyin.replace(/ /g, ''),
            provinceId: provinceCode,
          },
        });
        cityUpdated++;
      } else {
        // 创建新城市
        await prisma.city.create({
          data: {
            id: areaCode,
            name: c.ext_name,
            shortName: c.name,
            pinyin: c.pinyin.replace(/ /g, ''),
            provinceId: provinceCode,
          },
        });
        cityCount++;
      }
    } catch (e: any) {
      if (e.code !== 'P2002') {
        console.error(`  ❌ 城市导入失败: ${c.ext_name} - ${e.message}`);
      }
    }
  }
  console.log(`  ✅ 新增 ${cityCount} 个城市，更新 ${cityUpdated} 个城市\n`);

  // 4. 导入区县
  console.log('🏘️  导入区县...');
  let districtCount = 0;
  
  for (const d of districts) {
    const areaCode = getAreaCode(d.ext_id);
    // 使用短ID映射查找父城市的行政代码
    const cityCode = cityIdToCode.get(d.pid);
    
    if (!cityCode) {
      // 某些区县的父级可能是直辖市的市辖区，跳过
      continue;
    }
    
    // 检查父城市是否存在
    const cityExists = await prisma.city.findUnique({
      where: { id: cityCode }
    });
    
    if (!cityExists) {
      continue;
    }
    
    try {
      await prisma.district.upsert({
        where: { id: areaCode },
        update: {
          name: d.ext_name,
          shortName: d.name,
          pinyin: d.pinyin.replace(/ /g, ''),
          cityId: cityCode,
        },
        create: {
          id: areaCode,
          name: d.ext_name,
          shortName: d.name,
          pinyin: d.pinyin.replace(/ /g, ''),
          cityId: cityCode,
        },
      });
      districtCount++;
    } catch (e: any) {
      if (e.code !== 'P2002') {
        console.error(`  ❌ 区县导入失败: ${d.ext_name} - ${e.message}`);
      }
    }
  }
  console.log(`  ✅ 导入了 ${districtCount} 个区县\n`);

  // 5. 更新数据来源记录
  await prisma.dataSource.upsert({
    where: { id: 'area-data' },
    update: {
      lastSyncAt: new Date(),
      syncStatus: 'success',
      recordCount: provinceCount + cityCount + districtCount,
    },
    create: {
      id: 'area-data',
      name: 'xiangyuecn/AreaCity-JsSpider-StatsGov',
      type: 'opendata',
      url: 'https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov',
      description: '标准行政区划数据 - 省/市/区县三级',
      lastSyncAt: new Date(),
      syncStatus: 'success',
      recordCount: provinceCount + cityCount + districtCount,
      version: '2025',
    },
  });

  // 输出统计
  console.log('📊 最终统计:');
  const finalProvinces = await prisma.province.count();
  const finalCities = await prisma.city.count();
  const finalDistricts = await prisma.district.count();
  console.log(`  - 省份: ${finalProvinces}`);
  console.log(`  - 城市: ${finalCities}`);
  console.log(`  - 区县: ${finalDistricts}`);

  console.log('\n✨ 标准行政区划数据导入完成！');
}

// 执行导入
importAreaData()
  .catch((e) => {
    console.error('❌ 导入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
