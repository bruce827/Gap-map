import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

function toNumberOrNull(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export const GET = async () => {
  try {
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

    const cities = rows.map((row) => ({
      id: row.id ?? null,
      name: row.name ?? null,
      province: row.province ?? null,
      rank: row.rank ?? null,
      lat: toNumberOrNull(row.lat),
      lng: toNumberOrNull(row.lng),
      district: row.district ?? null,
      price: toNumberOrNull(row.avgSecondHandPrice ?? row.suitePrice),
      comfort_days: toNumberOrNull(row.comfortDays),
      green_rate: toNumberOrNull(row.greenRate)
    }));

    return json(cities);
  } catch (err) {
    console.error('GET /api/cities failed:', err);
    return json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
};
