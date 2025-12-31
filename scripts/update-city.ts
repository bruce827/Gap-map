/**
 * 城市数据更新脚本
 * Story 1-6: 数据维护入口
 * 
 * 用法:
 *   npx tsx scripts/update-city.ts --city "鹤岗市" --field price --value 2500
 *   npx tsx scripts/update-city.ts --city "鹤岗市" --field comfort_days --value 180
 *   npx tsx scripts/update-city.ts --city "鹤岗市" --field green_rate --value 42.5
 *   npx tsx scripts/update-city.ts --city "鹤岗市" --field district --value "兴安区"
 *   npx tsx scripts/update-city.ts --city "鹤岗市" --field rank --value 1
 *   npx tsx scripts/update-city.ts --city "鹤岗市" --field lat --value 47.35
 *   npx tsx scripts/update-city.ts --city "鹤岗市" --field lng --value 130.30
 *   npx tsx scripts/update-city.ts --list  # 列出所有可更新的城市
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type UpdateField = 'price' | 'comfort_days' | 'green_rate' | 'district' | 'rank' | 'lat' | 'lng';

interface UpdateOptions {
  cityName: string;
  field: UpdateField;
  value: string | number;
}

interface FieldConfig {
  table: 'City' | 'TangpingCity' | 'CityHousing' | 'CityClimate';
  column: string;
  label: string;
  type: 'number' | 'string';
}

const FIELD_CONFIG: Record<UpdateField, FieldConfig> = {
  price: { table: 'CityHousing', column: 'avgSecondHandPriceNum', label: '房价(元/㎡)', type: 'number' },
  comfort_days: { table: 'CityClimate', column: 'comfortDays', label: '舒适天数(天)', type: 'number' },
  green_rate: { table: 'CityClimate', column: 'greenCoverageRate', label: '绿化率(%)', type: 'number' },
  district: { table: 'TangpingCity', column: 'districtNames', label: '区县', type: 'string' },
  rank: { table: 'TangpingCity', column: 'rank', label: '排名', type: 'number' },
  lat: { table: 'City', column: 'lat', label: '纬度', type: 'number' },
  lng: { table: 'City', column: 'lng', label: '经度', type: 'number' },
};

const VALID_FIELDS = Object.keys(FIELD_CONFIG) as UpdateField[];

async function listCities() {
  console.log('📋 可更新的城市列表:\n');
  
  const cities = await prisma.tangpingCity.findMany({
    include: {
      city: true,
      housing: true,
      climate: true,
    },
    orderBy: { city: { name: 'asc' } },
  });

  console.log('城市名称\t\t房价\t\t舒适天数\t绿化率');
  console.log('-'.repeat(60));
  
  for (const tc of cities) {
    const name = tc.city.name.padEnd(10, ' ');
    const price = tc.housing?.avgSecondHandPriceNum ?? '-';
    const comfort = tc.climate?.comfortDays ?? '-';
    const green = tc.climate?.greenCoverageRate ?? '-';
    console.log(`${name}\t${price}\t\t${comfort}\t\t${green}`);
  }
  
  console.log(`\n共 ${cities.length} 个城市`);
}

async function updateCity(options: UpdateOptions) {
  const { cityName, field, value } = options;
  const config = FIELD_CONFIG[field];
  
  console.log(`\n🔍 查找城市: ${cityName}`);
  
  // 查找城市
  const tangpingCity = await prisma.tangpingCity.findFirst({
    where: {
      city: {
        name: { contains: cityName }
      }
    },
    include: {
      city: true,
      housing: true,
      climate: true,
    }
  });

  if (!tangpingCity) {
    console.error(`❌ 未找到城市: ${cityName}`);
    console.log('提示: 使用 --list 查看所有可用城市');
    process.exit(1);
  }

  console.log(`✅ 找到城市: ${tangpingCity.city.name} (ID: ${tangpingCity.id})`);
  
  // 获取旧值
  let oldValue: string | number | null = null;
  switch (field) {
    case 'price':
      oldValue = tangpingCity.housing?.avgSecondHandPriceNum ?? null;
      break;
    case 'comfort_days':
      oldValue = tangpingCity.climate?.comfortDays ?? null;
      break;
    case 'green_rate':
      oldValue = tangpingCity.climate?.greenCoverageRate ?? null;
      break;
    case 'district':
      oldValue = tangpingCity.districtNames ?? null;
      break;
    case 'rank':
      oldValue = tangpingCity.rank ?? null;
      break;
    case 'lat':
      oldValue = tangpingCity.city.lat ?? null;
      break;
    case 'lng':
      oldValue = tangpingCity.city.lng ?? null;
      break;
  }

  console.log(`📊 字段: ${config.label}`);
  console.log(`   旧值: ${oldValue ?? '(空)'}`);
  console.log(`   新值: ${value}`);

  // 执行更新
  try {
    switch (config.table) {
      case 'City':
        await prisma.city.update({
          where: { id: tangpingCity.city.id },
          data: { [config.column]: config.type === 'number' ? Number(value) : String(value) }
        });
        break;
      
      case 'TangpingCity':
        await prisma.tangpingCity.update({
          where: { id: tangpingCity.id },
          data: { [config.column]: config.type === 'number' ? Number(value) : String(value) }
        });
        break;
      
      case 'CityHousing':
        if (field === 'price') {
          const priceValue = Number(value);
          if (!tangpingCity.housing) {
            await prisma.cityHousing.create({
              data: {
                tangpingCityId: tangpingCity.id,
                avgSecondHandPriceNum: priceValue,
                avgSecondHandPrice: `${priceValue}元/㎡`,
              }
            });
          } else {
            await prisma.cityHousing.update({
              where: { id: tangpingCity.housing.id },
              data: { 
                avgSecondHandPriceNum: priceValue,
                avgSecondHandPrice: `${priceValue}元/㎡`,
              }
            });
          }
        }
        break;
      
      case 'CityClimate':
        const climateData = field === 'comfort_days' 
          ? { comfortDays: Math.round(Number(value)) }
          : { greenCoverageRate: Number(value) };
        
        if (!tangpingCity.climate) {
          await prisma.cityClimate.create({
            data: {
              tangpingCityId: tangpingCity.id,
              ...climateData,
            }
          });
        } else {
          await prisma.cityClimate.update({
            where: { id: tangpingCity.climate.id },
            data: climateData
          });
        }
        break;
    }

    console.log(`\n✅ 更新成功!`);
    console.log(`\n📝 验证步骤:`);
    console.log(`   1. 访问 http://localhost:5173/api/cities`);
    console.log(`   2. 搜索 "${tangpingCity.city.name}" 确认字段已更新`);
    
  } catch (error) {
    console.error(`\n❌ 更新失败:`, error);
    process.exit(1);
  }
}

function parseArgs(): { list: boolean; options?: UpdateOptions } {
  const args = process.argv.slice(2);
  
  if (args.includes('--list') || args.includes('-l')) {
    return { list: true };
  }
  
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
城市数据更新脚本

用法:
  npx tsx scripts/update-city.ts --city <城市名> --field <字段> --value <值>
  npx tsx scripts/update-city.ts --list

选项:
  --city, -c    城市名称 (支持模糊匹配)
  --field, -f   更新字段: ${VALID_FIELDS.join(' | ')}
  --value, -v   新值
  --list, -l    列出所有城市
  --help, -h    显示帮助

支持的字段:
  price         房价 (元/㎡)
  comfort_days  舒适天数 (天/年)
  green_rate    绿化率 (%)
  district      区县名称
  rank          排名
  lat           纬度
  lng           经度

示例:
  npx tsx scripts/update-city.ts --city "鹤岗" --field price --value 2500
  npx tsx scripts/update-city.ts -c "乳山" -f comfort_days -v 200
  npx tsx scripts/update-city.ts -c "鹤岗" -f district -v "兴安区/东山区"
  npx tsx scripts/update-city.ts -c "鹤岗" -f lat -v 47.35
`);
    process.exit(0);
  }

  let cityName = '';
  let field: UpdateField = 'price';
  let value: string | number = 0;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    
    if ((arg === '--city' || arg === '-c') && next) {
      cityName = next;
      i++;
    } else if ((arg === '--field' || arg === '-f') && next) {
      if (!VALID_FIELDS.includes(next as UpdateField)) {
        console.error(`❌ 无效字段: ${next}`);
        console.log(`有效字段: ${VALID_FIELDS.join(', ')}`);
        process.exit(1);
      }
      field = next as UpdateField;
      i++;
    } else if ((arg === '--value' || arg === '-v') && next) {
      const config = FIELD_CONFIG[field];
      if (config.type === 'number') {
        value = parseFloat(next);
        if (isNaN(value)) {
          console.error(`❌ 无效数值: ${next}`);
          process.exit(1);
        }
      } else {
        value = next;
      }
      i++;
    }
  }

  if (!cityName) {
    console.error('❌ 缺少 --city 参数');
    process.exit(1);
  }

  return { list: false, options: { cityName, field, value } };
}

async function main() {
  const { list, options } = parseArgs();
  
  if (list) {
    await listCities();
  } else if (options) {
    await updateCity(options);
  }
}

main()
  .catch(e => {
    console.error('❌ 脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
