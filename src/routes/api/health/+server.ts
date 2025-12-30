import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET = async () => {
  const ts = new Date().toISOString();

  try {
    const cityCount = await prisma.city.count();

    return json({
      ok: true,
      ts,
      dbOk: true,
      cityCount
    });
  } catch (err) {
    return json({
      ok: true,
      ts,
      dbOk: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
};
