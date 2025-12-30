import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import pkg from '../../../../package.json';

export const GET = async () => {
  const ts = new Date().toISOString();
  const version = (pkg as { version?: string }).version ?? null;

  try {
    const cityCount = await prisma.city.count();

    return json({
      ok: true,
      version,
      ts,
      dbOk: true,
      cityCount
    });
  } catch (err) {
    return json({
      ok: true,
      version,
      ts,
      dbOk: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
};
