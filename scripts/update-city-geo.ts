/**
 * Gap-map 城市经纬度更新脚本
 * 从 ok_geo.csv 读取坐标数据更新到 City 表
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface GeoRecord {
  id: string;        // 短ID (如: 11, 1101, 110101)
  pid: string;       // 父ID
  deep: string;      // 层级: 0=省, 1=市, 2=区县
  name: string;      // 名称
  ext_path: string;  // 完整路径
  geo: string;       // 坐标 "lng lat"
  polygon: string;   // 边界（不使用）
}

// 短ID转6位行政代码
function shortIdToAreaCode(shortId: string, deep: string): string {
  // deep=0 省份: 11 -> 110000
  // deep=1 城市: 1101 -> 110100
  // deep=2 区县: 110101 -> 110101
  const id = shortId.padEnd(6, '0');
  if (deep === '0') {
    return shortId.padEnd(2, '0').padEnd(6, '0');
  } else if (deep === '1') {
    return shortId.padEnd(4, '0').padEnd(6, '0');
  } else {
    return shortId.padEnd(6, '0');
  }
}

async function updateCityGeo() {
  console.log('🚀 开始更新城市经纬度...\n');

  // 读取CSV文件
  const csvPath = path.join(__dirname, '../data/ok_geo.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ 找不到 ok_geo.csv 文件，请先下载');
    console.error('   下载地址: https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/releases');
    process.exit(1);
  }

  let csvContent = fs.readFileSync(csvPath, 'utf-8');
  // 移除BOM
  if (csvContent.charCodeAt(0) === 0xFEFF) {
    csvContent = csvContent.slice(1);
  }

  // 解析CSV
  const records: GeoRecord[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  console.log(`📊 共读取 ${records.length} 条记录\n`);

  // 只处理城市级别 (deep=1)
  const cityRecords = records.filter(r => r.deep === '1');
  console.log(`🏙️  筛选出 ${cityRecords.length} 个城市记录\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const record of cityRecords) {
    // 解析坐标
    if (!record.geo || record.geo === 'EMPTY') {
      skipped++;
      continue;
    }

    const [lngStr, latStr] = record.geo.trim().split(' ');
    const lng = parseFloat(lngStr);
    const lat = parseFloat(latStr);

    if (isNaN(lng) || isNaN(lat)) {
      skipped++;
      continue;
    }

    // 构建行政代码
    const areaCode = shortIdToAreaCode(record.id, record.deep);

    try {
      const result = await prisma.city.updateMany({
        where: { id: areaCode },
        data: { lat, lng },
      });

      if (result.count > 0) {
        updated++;
      } else {
        notFound++;
      }
    } catch (e: any) {
      console.error(`  ❌ 更新失败: ${record.name} (${areaCode}) - ${e.message}`);
    }
  }

  console.log(`\n📊 更新结果:`);
  console.log(`  ✅ 成功更新: ${updated} 个城市`);
  console.log(`  ⏭️  跳过(无坐标): ${skipped} 个`);
  console.log(`  ❓ 未找到: ${notFound} 个`);

  // 验证
  const sample = await prisma.city.findMany({
    where: { lat: { not: null } },
    take: 5,
    select: { name: true, lat: true, lng: true },
  });
  console.log('\n📍 示例数据:');
  sample.forEach(c => {
    console.log(`  ${c.name}: ${c.lat}, ${c.lng}`);
  });

  console.log('\n✨ 城市经纬度更新完成！');
}

// 执行
updateCityGeo()
  .catch((e) => {
    console.error('❌ 更新失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
