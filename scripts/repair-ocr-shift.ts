/**
 * 修复 OCR 导致的 CSV 缺列/错位问题，并回写到 SQLite 数据库。
 *
 * 核心思路：
 * - `data/cities_complete.csv` 行列数不一致（缺少空占位），导致后续字段整体左移/右移。
 * - 用“语义匹配 + 顺序约束”的动态规划对齐每行到固定表头，再按对齐结果更新 Prisma 表。
 *
 * 用法：
 * - 预览：`tsx scripts/repair-ocr-shift.ts`
 * - 执行：`tsx scripts/repair-ocr-shift.ts --apply`
 */

import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

type AlignedRow = Record<string, string>;

const EXPECTED_HEADER = [
  '序号',
  '省份',
  '城市',
  '区县',
  '躺平目标地点',
  '平均二手房价格',
  '一套房价格',
  '低房价区域',
  '低房价格',
  '医院等级',
  '医院名称',
  '城市纬度类型',
  '全年气温舒适天数',
  '城市绿化覆盖率',
  '环境卫生水平',
  '消费水平',
  '活跃人数',
  '飞机',
  '高铁',
  '城铁',
  '地铁大巴',
  '市内公交车',
  '铁路',
];

const EMPTY_TOKENS = new Set(['', '-', '/', '／']);

function isEmptyToken(value: string): boolean {
  return EMPTY_TOKENS.has(value.trim());
}

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || isEmptyToken(trimmed)) return null;
  return trimmed;
}

function trimValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function hasAny(value: string, needles: string[]): boolean {
  return needles.some((n) => value.includes(n));
}

function extractFirstNumber(value: string): number | null {
  const match = value.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const num = Number(match[0]);
  return Number.isFinite(num) ? num : null;
}

function looksLikePercent(value: string): boolean {
  if (isEmptyToken(value)) return true;
  if (value.includes('%')) return true;
  const num = extractFirstNumber(value);
  return num !== null && num >= 0 && num <= 100 && !hasAny(value, ['元', '万', '天', '医院']);
}

function looksLikeDays(value: string): boolean {
  if (isEmptyToken(value)) return true;
  if (value.includes('%')) return false;
  if (value.includes('天')) return true;
  const num = extractFirstNumber(value);
  return num !== null && Number.isInteger(num) && num >= 0 && num <= 366 && !hasAny(value, ['元', '万', '㎡', 'm²', '平', '医院']);
}

function looksLikePrice(value: string): boolean {
  if (isEmptyToken(value)) return true;
  if (value.includes('%') || value.includes('天')) return false;
  if (hasAny(value, ['元', '万', '㎡', 'm²', '平', '套'])) return true;
  const num = extractFirstNumber(value);
  return num !== null && num >= 500 && num <= 200000;
}

function looksLikeHospitalLevel(value: string): boolean {
  if (isEmptyToken(value)) return true;
  return hasAny(value, ['三甲', '三乙', '二甲', '三级', '二级', '四级']);
}

function looksLikeHospitalName(value: string): boolean {
  if (isEmptyToken(value)) return true;
  return value.includes('医院') || value.includes('医学院') || value.includes('中心');
}

function looksLikeLatitudeType(value: string): boolean {
  if (isEmptyToken(value)) return true;
  return ['满洲冷城', '沿海冷城', '内陆', '十分的暖', '岛崛区', '岛崛', '岛嶼'].some((k) => value.includes(k));
}

function looksLikeHygiene(value: string): boolean {
  if (isEmptyToken(value)) return true;
  return hasAny(value, ['国家卫生城市', '省级卫生城市', '卫生城市', '省级']);
}

function looksLikeConsumption(value: string): boolean {
  if (isEmptyToken(value)) return true;
  const v = value.trim();
  if (['高', '中', '低', '县', '覆盖'].includes(v)) return true;
  if (v.length <= 3 && hasAny(v, ['高', '中', '低'])) return true;
  return false;
}

function looksLikeTransport(value: string): boolean {
  if (isEmptyToken(value)) return true;
  return hasAny(value, ['覆盖', '部分', '乡镇', '乡村', '机场', '高铁', '地铁', '公交', '铁路', '城铁', '有']);
}

function looksLikeTargetLocation(value: string): boolean {
  if (isEmptyToken(value)) return true;
  if (looksLikePrice(value) || looksLikeDays(value) || looksLikePercent(value)) return false;
  if (looksLikeHospitalLevel(value) || looksLikeHospitalName(value) || looksLikeLatitudeType(value)) return false;
  if (looksLikeHygiene(value) || looksLikeTransport(value)) return false;
  return true;
}

function missingPenalty(column: string): number {
  if (['序号', '省份', '城市'].includes(column)) return 50;
  if (['区县'].includes(column)) return 10;
  if (['躺平目标地点', '活跃人数'].includes(column)) return 0.8;
  if (['飞机', '高铁', '城铁', '地铁大巴', '市内公交车', '铁路'].includes(column)) return 0.6;
  return 2;
}

function dropPenalty(value: string): number {
  return isEmptyToken(value) ? 0.2 : 6;
}

function matchPenalty(column: string, value: string): number {
  const v = value.trim();
  if (isEmptyToken(v)) return 0.4;

  const penalizeBad = (bad: boolean, good: boolean): number => {
    if (good) return 0;
    if (bad) return 12;
    return 4;
  };

  switch (column) {
    case '序号': {
      const good = /^\d+$/.test(v);
      return penalizeBad(!good, good);
    }
    case '省份':
    case '城市':
    case '区县': {
      const bad = looksLikePrice(v) || looksLikeDays(v) || looksLikePercent(v);
      return penalizeBad(bad, !bad);
    }
    case '躺平目标地点': {
      const good = looksLikeTargetLocation(v);
      const bad = !good;
      return penalizeBad(bad, good);
    }
    case '平均二手房价格':
    case '一套房价格':
    case '低房价格': {
      const good = looksLikePrice(v);
      const bad = looksLikeDays(v) || looksLikePercent(v) || looksLikeHospitalLevel(v) || looksLikeHospitalName(v) || looksLikeHygiene(v) || looksLikeTransport(v);
      return penalizeBad(bad, good);
    }
    case '低房价区域': {
      const good = looksLikeTargetLocation(v) && !looksLikePrice(v);
      const bad = looksLikePrice(v) || looksLikeDays(v) || looksLikePercent(v) || looksLikeHospitalLevel(v) || looksLikeHospitalName(v);
      return penalizeBad(bad, good);
    }
    case '医院等级': {
      const good = looksLikeHospitalLevel(v);
      const bad = looksLikeHospitalName(v) || looksLikePrice(v) || looksLikeDays(v) || looksLikePercent(v) || looksLikeTransport(v);
      return penalizeBad(bad, good);
    }
    case '医院名称': {
      const good = looksLikeHospitalName(v);
      const bad = looksLikeHospitalLevel(v) || looksLikePrice(v) || looksLikeDays(v) || looksLikePercent(v) || looksLikeTransport(v);
      return penalizeBad(bad, good);
    }
    case '城市纬度类型': {
      const good = looksLikeLatitudeType(v);
      const bad = looksLikeDays(v) || looksLikePercent(v) || looksLikePrice(v) || looksLikeHospitalName(v);
      return penalizeBad(bad, good);
    }
    case '全年气温舒适天数': {
      const good = looksLikeDays(v);
      const bad = looksLikePrice(v) || looksLikePercent(v) || looksLikeHospitalName(v) || looksLikeTransport(v);
      return penalizeBad(bad, good);
    }
    case '城市绿化覆盖率': {
      const good = looksLikePercent(v);
      const bad = looksLikeDays(v) || looksLikePrice(v) || looksLikeHospitalName(v) || looksLikeTransport(v);
      return penalizeBad(bad, good);
    }
    case '环境卫生水平': {
      const good = looksLikeHygiene(v);
      const bad = looksLikePercent(v) || looksLikeDays(v) || looksLikePrice(v) || looksLikeTransport(v);
      return penalizeBad(bad, good);
    }
    case '消费水平': {
      const good = looksLikeConsumption(v);
      const bad = looksLikePercent(v) || looksLikeDays(v) || looksLikePrice(v) || looksLikeHygiene(v) || looksLikeTransport(v);
      return penalizeBad(bad, good);
    }
    case '活跃人数': {
      const bad = looksLikeTransport(v) || looksLikePrice(v) || looksLikePercent(v) || looksLikeDays(v);
      return penalizeBad(bad, !bad);
    }
    case '飞机':
    case '高铁':
    case '城铁':
    case '地铁大巴':
    case '市内公交车':
    case '铁路': {
      const good = looksLikeTransport(v);
      const bad = looksLikePrice(v) || looksLikeDays(v) || looksLikePercent(v) || looksLikeHospitalName(v) || looksLikeHygiene(v) || looksLikeConsumption(v);
      return penalizeBad(bad, good);
    }
    default: {
      return 5;
    }
  }
}

type Move = 'match' | 'missing' | 'drop';

function alignToHeader(header: string[], values: string[]): { aligned: string[]; totalCost: number } {
  const m = header.length;
  const n = values.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(Number.POSITIVE_INFINITY));
  const prev: { move: Move; i: number; j: number }[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => ({ move: 'missing' as Move, i: 0, j: 0 })),
  );

  dp[0][0] = 0;

  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      const base = dp[i][j];
      if (!Number.isFinite(base)) continue;

      // 1) 缺失该列：header[i] 为空
      if (i < m) {
        const cost = base + missingPenalty(header[i]);
        if (cost < dp[i + 1][j]) {
          dp[i + 1][j] = cost;
          prev[i + 1][j] = { move: 'missing', i, j };
        }
      }

      // 2) 丢弃一个多余值
      if (j < n) {
        const cost = base + dropPenalty(values[j]);
        if (cost < dp[i][j + 1]) {
          dp[i][j + 1] = cost;
          prev[i][j + 1] = { move: 'drop', i, j };
        }
      }

      // 3) 匹配：header[i] <- values[j]
      if (i < m && j < n) {
        const cost = base + matchPenalty(header[i], values[j]);
        if (cost < dp[i + 1][j + 1]) {
          dp[i + 1][j + 1] = cost;
          prev[i + 1][j + 1] = { move: 'match', i, j };
        }
      }
    }
  }

  const aligned = Array(m).fill('');
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    const p = prev[i][j];
    if (p.move === 'match') {
      aligned[i - 1] = values[j - 1];
      i = p.i;
      j = p.j;
    } else if (p.move === 'missing') {
      aligned[i - 1] = '';
      i = p.i;
      j = p.j;
    } else {
      // drop
      i = p.i;
      j = p.j;
    }
  }

  return { aligned, totalCost: dp[m][n] };
}

function toAlignedRow(header: string[], alignedValues: string[]): AlignedRow {
  const row: AlignedRow = {};
  for (let i = 0; i < header.length; i++) row[header[i]] = alignedValues[i] ?? '';
  return row;
}

// ============================================================
// 解析与映射（与 import-csv.ts 保持一致，并修正少量容错）
// ============================================================

function parsePrice(text: string): number | null {
  if (!text || text === '-' || text === '/' || text.trim() === '') return null;

  const cleaned = text.replace(/[约红]/g, '').trim();

  const rangeMatch = cleaned.match(/(\d+\.?\d*)[-~](\d+\.?\d*)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    const avg = (min + max) / 2;
    if (cleaned.includes('万')) return avg * 10000;
    return avg;
  }

  const patterns = [
    { regex: /(\d+\.?\d*)万/, multiplier: 10000 },
    { regex: /(\d+\.?\d*)元/, multiplier: 1 },
    { regex: /(\d+\.?\d*)/, multiplier: 1 },
  ];

  for (const { regex, multiplier } of patterns) {
    const match = cleaned.match(regex);
    if (match) {
      const value = parseFloat(match[1]) * multiplier;
      if (value < 100 && text.includes('万')) return value * 10000;
      return value;
    }
  }

  return null;
}

function parsePercentage(text: string): number | null {
  if (!text || text === '-' || text === '/' || text.trim() === '') return null;
  const match = text.match(/(\d+\.?\d*)%?/);
  return match ? parseFloat(match[1]) : null;
}

function parseDays(text: string): number | null {
  if (!text || text === '-' || text === '/' || text.trim() === '') return null;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

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
  const v = raw.trim();
  if (v === '县') return 'LOW';
  if (v === '高') return 'HIGH';
  if (v === '中') return 'MEDIUM';
  if (v === '低') return 'LOW';
  // 兼容历史数据（OCR 把“中”识别成“覆盖”的情况）
  if (v === '覆盖') return 'MEDIUM';
  return 'UNKNOWN';
}

function mapTransportCoverage(raw: string): string {
  if (!raw || raw === '-' || raw.trim() === '') return 'NONE';
  if (raw.includes('乡镇') || raw.includes('乡村')) return 'TOWN_LEVEL';
  if (raw.includes('覆盖')) return 'FULL';
  if (raw.includes('部分')) return 'PARTIAL';
  return 'NONE';
}

function normalizeCityName(name: string): string {
  return name.replace(/[市区县州地区盟]/g, '').trim();
}

async function findCityByName(
  cityName: string,
  provinceName: string,
): Promise<{ id: string; name: string } | null> {
  const province = await prisma.province.findFirst({
    where: {
      OR: [{ name: { contains: provinceName } }, { shortName: { contains: provinceName } }],
    },
  });

  if (!province) return null;

  const candidates = cityName
    .split(/[\\/／]/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const candidate of candidates.length > 0 ? candidates : [cityName]) {
    const normalizedName = normalizeCityName(candidate);

    const city = await prisma.city.findFirst({
      where: {
        provinceId: province.id,
        OR: [
          { name: { contains: normalizedName } },
          { shortName: { contains: normalizedName } },
          { name: { contains: candidate } },
        ],
      },
      select: { id: true, name: true },
    });

    if (city) return city;
  }

  return null;
}

function formatBackupName(dbPath: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${dbPath}.bak-${stamp}`;
}

function pickBestRow(rows: AlignedRow[]): AlignedRow {
  const keyColumns = [
    '平均二手房价格',
    '一套房价格',
    '低房价区域',
    '低房价格',
    '医院等级',
    '医院名称',
    '城市纬度类型',
    '全年气温舒适天数',
    '城市绿化覆盖率',
    '环境卫生水平',
    '消费水平',
    '飞机',
    '高铁',
    '城铁',
    '地铁大巴',
    '市内公交车',
    '铁路',
  ];

  const scoreRow = (row: AlignedRow) =>
    keyColumns.reduce((acc, k) => {
      const v = trimValue(row[k]);
      if (!v || isEmptyToken(v)) return acc;
      return acc + 1;
    }, 0);

  return rows
    .slice()
    .sort((a, b) => scoreRow(b) - scoreRow(a))[0];
}

async function upsertTargetLocation(
  tx: Prisma.TransactionClient,
  tangpingCityId: string,
  name: string,
): Promise<boolean> {
  const trimmed = name.trim();
  if (!trimmed || isEmptyToken(trimmed)) return false;
  if (!looksLikeTargetLocation(trimmed)) return false;

  const existing = await tx.targetLocation.findFirst({
    where: { tangpingCityId, name: trimmed },
    select: { id: true },
  });
  if (existing) return false;

  await tx.targetLocation.create({
    data: { tangpingCityId, name: trimmed },
  });
  return true;
}

function parseArgs(argv: string[]) {
  const args = new Set(argv);
  const getValue = (key: string): string | undefined => {
    const idx = argv.indexOf(key);
    if (idx === -1) return undefined;
    return argv[idx + 1];
  };

  const apply = args.has('--apply');
  const reportUnmatched = args.has('--report-unmatched');
  const limitRaw = getValue('--limit');
  const limit = limitRaw ? Number(limitRaw) : undefined;
  const cityFilter = getValue('--city');

  return { apply, reportUnmatched, limit: Number.isFinite(limit) ? (limit as number) : undefined, cityFilter };
}

async function main() {
  const { apply, reportUnmatched, limit, cityFilter } = parseArgs(process.argv.slice(2));

  const csvPath = path.join(__dirname, '../data/cities_complete.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ 找不到 CSV:', csvPath);
    process.exit(1);
  }

  let csvContent = fs.readFileSync(csvPath, 'utf-8');
  if (csvContent.charCodeAt(0) === 0xfeff) csvContent = csvContent.slice(1);

  const records: string[][] = parse(csvContent, {
    relax_column_count: true,
    relax_quotes: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length < 2) {
    console.error('❌ CSV 内容为空或无数据行');
    process.exit(1);
  }

  const header = records[0].map((h) => trimValue(h));
  const headerKey = header.join(',');
  const expectedKey = EXPECTED_HEADER.join(',');
  if (headerKey !== expectedKey) {
    console.error('❌ CSV 表头不符合预期，无法安全修复。');
    console.error('实际表头:', header);
    console.error('预期表头:', EXPECTED_HEADER);
    process.exit(1);
  }

  const dataRows = records.slice(1);
  const cityMatchCache = new Map<string, { id: string; name: string } | null>();
  const grouped = new Map<string, { city: { id: string; name: string }; rows: AlignedRow[] }>();
  const unmatched: Array<{
    fileLine: number;
    seq: string;
    province: string;
    city: string;
    district: string;
    raw: string[];
    aligned: AlignedRow;
  }> = [];

  let alignedRows = 0;
  let changedAlignmentRows = 0;
  let unmatchedRows = 0;

  for (let idx = 0; idx < dataRows.length; idx++) {
    if (limit !== undefined && alignedRows >= limit) break;

    const rawValues = dataRows[idx].map((v) => trimValue(v));
    if (rawValues.length === 0) continue;

    const { aligned } = alignToHeader(EXPECTED_HEADER, rawValues);
    const row = toAlignedRow(EXPECTED_HEADER, aligned);

    const provinceName = trimValue(row['省份']);
    const cityName = trimValue(row['城市']);

    if (!provinceName || !cityName) continue;
    if (cityFilter && !cityName.includes(cityFilter)) continue;

    const cacheKey = `${provinceName}::${cityName}`;
    let city = cityMatchCache.get(cacheKey);
    if (city === undefined) {
      city = await findCityByName(cityName, provinceName);
      cityMatchCache.set(cacheKey, city);
    }

    alignedRows++;
    const naive = EXPECTED_HEADER.map((_, i) => rawValues[i] ?? '');
    const changed = aligned.some((v, i) => v !== naive[i]);
    if (changed) changedAlignmentRows++;

    if (!city) {
      unmatchedRows++;
      unmatched.push({
        fileLine: idx + 2,
        seq: trimValue(row['序号']),
        province: provinceName,
        city: cityName,
        district: trimValue(row['区县']),
        raw: rawValues,
        aligned: row,
      });
      continue;
    }

    const bucket = grouped.get(city.id) ?? { city, rows: [] };
    bucket.rows.push(row);
    grouped.set(city.id, bucket);
  }

  if (!apply) {
    console.log('🧪 预览模式（不写入数据库）');
    console.log(`- CSV 行数: ${dataRows.length}`);
    console.log(`- 参与对齐行数: ${alignedRows}`);
    console.log(`- 需要修正/插空的行数: ${changedAlignmentRows}`);
    console.log(`- 匹配到标准城市数: ${grouped.size}`);
    console.log(`- 未匹配行数: ${unmatchedRows}`);

    if (reportUnmatched) {
      console.log('\n📌 未匹配明细（按 CSV 行号）:');
      for (const u of unmatched) {
        console.log(
          `- line ${u.fileLine} | 序号=${u.seq || '-'} | 省份=${u.province} | 城市=${u.city} | 区县=${u.district || '-'}`,
        );
      }
    }
    console.log('\n如需写入数据库，请使用: tsx scripts/repair-ocr-shift.ts --apply');
    return;
  }

  // 1) 整库备份
  const dbFile = path.resolve(__dirname, '../data/gapmap.db');
  if (!fs.existsSync(dbFile)) {
    console.error('❌ 找不到数据库文件:', dbFile);
    process.exit(1);
  }
  const backupFile = formatBackupName(dbFile);
  fs.copyFileSync(dbFile, backupFile);
  console.log('✅ 已备份数据库:', backupFile);

  // 2) 回写修复
  let updatedCities = 0;
  let createdTargetLocations = 0;

  for (const { city, rows } of grouped.values()) {
    const best = pickBestRow(rows);

    const rank = Number.parseInt(trimValue(best['序号']), 10);
    const districtNames = trimValue(best['区县']);

    const avgPrice = trimValue(best['平均二手房价格']);
    const suitePrice = trimValue(best['一套房价格']);
    const lowPriceArea = trimValue(best['低房价区域']);
    const lowPrice = trimValue(best['低房价格']);

    const hospitalLevelRaw = trimValue(best['医院等级']);
    const hospitalName = trimValue(best['医院名称']);

    const latitudeTypeRaw = trimValue(best['城市纬度类型']);
    const comfortDaysRaw = trimValue(best['全年气温舒适天数']);
    const greenCoverageRaw = trimValue(best['城市绿化覆盖率']);

    const hygieneLevelRaw = trimValue(best['环境卫生水平']);
    const consumptionLevelRaw = trimValue(best['消费水平']);
    const activePopulation = trimValue(best['活跃人数']);

    const airplaneRaw = trimValue(best['飞机']);
    const highSpeedRailRaw = trimValue(best['高铁']);
    const cityRailRaw = trimValue(best['城铁']);
    const subwayBusRaw = trimValue(best['地铁大巴']);
    const cityBusRaw = trimValue(best['市内公交车']);
    const railwayRaw = trimValue(best['铁路']);

    await prisma.$transaction(async (tx) => {
      const tangpingCity = await tx.tangpingCity.upsert({
        where: { cityId: city.id },
        update: {
          districtNames: toNullable(districtNames),
          rank: Number.isFinite(rank) ? rank : null,
        },
        create: {
          cityId: city.id,
          districtNames: toNullable(districtNames),
          rank: Number.isFinite(rank) ? rank : null,
        },
        select: { id: true },
      });

      await tx.cityHousing.upsert({
        where: { tangpingCityId: tangpingCity.id },
        update: {
          avgSecondHandPrice: avgPrice || null,
          avgSecondHandPriceNum: parsePrice(avgPrice),
          suitePrice: suitePrice || null,
          suitePriceNum: parsePrice(suitePrice),
          lowPriceArea: lowPriceArea || null,
          lowPrice: lowPrice || null,
          lowPriceNum: parsePrice(lowPrice),
        },
        create: {
          tangpingCityId: tangpingCity.id,
          avgSecondHandPrice: avgPrice || null,
          avgSecondHandPriceNum: parsePrice(avgPrice),
          suitePrice: suitePrice || null,
          suitePriceNum: parsePrice(suitePrice),
          lowPriceArea: lowPriceArea || null,
          lowPrice: lowPrice || null,
          lowPriceNum: parsePrice(lowPrice),
        },
      });

      await tx.cityMedical.upsert({
        where: { tangpingCityId: tangpingCity.id },
        update: {
          hospitalLevelRaw: hospitalLevelRaw || null,
          hospitalLevel: mapHospitalLevel(hospitalLevelRaw),
          hospitalName: hospitalName || null,
        },
        create: {
          tangpingCityId: tangpingCity.id,
          hospitalLevelRaw: hospitalLevelRaw || null,
          hospitalLevel: mapHospitalLevel(hospitalLevelRaw),
          hospitalName: hospitalName || null,
        },
      });

      await tx.cityClimate.upsert({
        where: { tangpingCityId: tangpingCity.id },
        update: {
          latitudeTypeRaw: latitudeTypeRaw || null,
          latitudeType: mapLatitudeType(latitudeTypeRaw),
          comfortDays: parseDays(comfortDaysRaw),
          greenCoverageRate: parsePercentage(greenCoverageRaw),
        },
        create: {
          tangpingCityId: tangpingCity.id,
          latitudeTypeRaw: latitudeTypeRaw || null,
          latitudeType: mapLatitudeType(latitudeTypeRaw),
          comfortDays: parseDays(comfortDaysRaw),
          greenCoverageRate: parsePercentage(greenCoverageRaw),
        },
      });

      await tx.cityLiving.upsert({
        where: { tangpingCityId: tangpingCity.id },
        update: {
          hygieneLevelRaw: hygieneLevelRaw || null,
          hygieneLevel: mapHygieneLevel(hygieneLevelRaw),
          consumptionLevelRaw: consumptionLevelRaw || null,
          consumptionLevel: mapConsumptionLevel(consumptionLevelRaw),
          activePopulation: activePopulation || null,
        },
        create: {
          tangpingCityId: tangpingCity.id,
          hygieneLevelRaw: hygieneLevelRaw || null,
          hygieneLevel: mapHygieneLevel(hygieneLevelRaw),
          consumptionLevelRaw: consumptionLevelRaw || null,
          consumptionLevel: mapConsumptionLevel(consumptionLevelRaw),
          activePopulation: activePopulation || null,
        },
      });

      const airplane = mapTransportCoverage(airplaneRaw);
      const highSpeedRail = mapTransportCoverage(highSpeedRailRaw);
      const cityRail = mapTransportCoverage(cityRailRaw);
      const subwayBus = mapTransportCoverage(subwayBusRaw);
      const cityBus = mapTransportCoverage(cityBusRaw);
      const railway = mapTransportCoverage(railwayRaw);

      await tx.cityTransport.upsert({
        where: { tangpingCityId: tangpingCity.id },
        update: {
          airplaneRaw: airplaneRaw || null,
          airplane,
          highSpeedRailRaw: highSpeedRailRaw || null,
          highSpeedRail,
          cityRailRaw: cityRailRaw || null,
          cityRail,
          subwayBusRaw: subwayBusRaw || null,
          subwayBus,
          cityBusRaw: cityBusRaw || null,
          cityBus,
          railwayRaw: railwayRaw || null,
          railway,
          hasAirport: airplane !== 'NONE',
          hasHighSpeedRail: highSpeedRail !== 'NONE',
          hasCityRail: cityRail !== 'NONE',
          hasSubway: subwayBus !== 'NONE',
        },
        create: {
          tangpingCityId: tangpingCity.id,
          airplaneRaw: airplaneRaw || null,
          airplane,
          highSpeedRailRaw: highSpeedRailRaw || null,
          highSpeedRail,
          cityRailRaw: cityRailRaw || null,
          cityRail,
          subwayBusRaw: subwayBusRaw || null,
          subwayBus,
          cityBusRaw: cityBusRaw || null,
          cityBus,
          railwayRaw: railwayRaw || null,
          railway,
          hasAirport: airplane !== 'NONE',
          hasHighSpeedRail: highSpeedRail !== 'NONE',
          hasCityRail: cityRail !== 'NONE',
          hasSubway: subwayBus !== 'NONE',
        },
      });

      for (const row of rows) {
        const target = trimValue(row['躺平目标地点']);
        if (!target) continue;
        const created = await upsertTargetLocation(tx, tangpingCity.id, target);
        if (created) createdTargetLocations += 1;
      }
    });

    updatedCities++;
  }

  console.log('\n✅ 修复完成');
  console.log(`- 写入城市数: ${updatedCities}`);
  console.log(`- 新增躺平目标地点: ${createdTargetLocations}`);
  console.log(`- 未匹配行数: ${unmatchedRows}`);
}

main()
  .catch((e) => {
    console.error('❌ 执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
