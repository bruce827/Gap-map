import { prisma } from '$lib/server/prisma';
import type { City, CityPoint } from '$lib/types';

function toNumberOrNull(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toCityPoint(city: City): CityPoint | null {
  if (!city.id) return null;
  if (!city.name) return null;
  if (!Number.isFinite(city.lat ?? Number.NaN)) return null;
  if (!Number.isFinite(city.lng ?? Number.NaN)) return null;

  return {
    id: city.id,
    name: city.name,
    lat: city.lat as number,
    lng: city.lng as number
  };
}

export const cityRepository = {
  async findAll(): Promise<City[]> {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT
        城市代码 AS id,
        城市 AS name,
        省份 AS province,
        排名 AS rank,
        纬度 AS lat,
        经度 AS lng,
        区县 AS district,
        二手房价格_元 AS avgSecondHandPrice,
        套房价格_元 AS suitePrice,
        舒适天数 AS comfortDays,
        绿化覆盖率 AS greenRate
      FROM v_tangping_cities
      ORDER BY rank
    `;

    return rows.map((row) => ({
      id: String(row.id ?? ''),
      name: String(row.name ?? ''),
      province: row.province ? String(row.province) : null,
      rank: toNumberOrNull(row.rank),
      lat: toNumberOrNull(row.lat),
      lng: toNumberOrNull(row.lng),
      district: row.district ? String(row.district) : null,
      price: toNumberOrNull(row.avgSecondHandPrice ?? row.suitePrice),
      comfort_days: toNumberOrNull(row.comfortDays),
      green_rate: toNumberOrNull(row.greenRate)
    }));
  },

  async findAllPoints(): Promise<CityPoint[]> {
    const cities = await this.findAll();
    return cities.map(toCityPoint).filter((x): x is CityPoint => Boolean(x));
  },

  async findById(id: string): Promise<City | null> {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT
        城市代码 AS id,
        城市 AS name,
        省份 AS province,
        排名 AS rank,
        纬度 AS lat,
        经度 AS lng,
        区县 AS district,
        二手房价格_元 AS avgSecondHandPrice,
        套房价格_元 AS suitePrice,
        舒适天数 AS comfortDays,
        绿化覆盖率 AS greenRate
      FROM v_tangping_cities
      WHERE 城市代码 = ${id}
      LIMIT 1
    `;

    const first = rows[0];
    if (!first) return null;

    return {
      id: String(first.id ?? ''),
      name: String(first.name ?? ''),
      province: first.province ? String(first.province) : null,
      rank: toNumberOrNull(first.rank),
      lat: toNumberOrNull(first.lat),
      lng: toNumberOrNull(first.lng),
      district: first.district ? String(first.district) : null,
      price: toNumberOrNull(first.avgSecondHandPrice ?? first.suitePrice),
      comfort_days: toNumberOrNull(first.comfortDays),
      green_rate: toNumberOrNull(first.greenRate)
    };
  },

  async findByName(query: string, { limit = 50 }: { limit?: number } = {}): Promise<City[]> {
    const q = `%${query}%`;

    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT
        城市代码 AS id,
        城市 AS name,
        省份 AS province,
        排名 AS rank,
        纬度 AS lat,
        经度 AS lng,
        区县 AS district,
        二手房价格_元 AS avgSecondHandPrice,
        套房价格_元 AS suitePrice,
        舒适天数 AS comfortDays,
        绿化覆盖率 AS greenRate
      FROM v_tangping_cities
      WHERE 城市 LIKE ${q} OR 城市拼音 LIKE ${q}
      ORDER BY rank
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      id: String(row.id ?? ''),
      name: String(row.name ?? ''),
      province: row.province ? String(row.province) : null,
      rank: toNumberOrNull(row.rank),
      lat: toNumberOrNull(row.lat),
      lng: toNumberOrNull(row.lng),
      district: row.district ? String(row.district) : null,
      price: toNumberOrNull(row.avgSecondHandPrice ?? row.suitePrice),
      comfort_days: toNumberOrNull(row.comfortDays),
      green_rate: toNumberOrNull(row.greenRate)
    }));
  }
};
