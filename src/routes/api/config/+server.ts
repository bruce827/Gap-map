import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const GET = async () => {
  if (!env.AMAP_KEY) {
    return json(
      { error: 'AMAP_KEY is not configured. Please set AMAP_KEY in root .env.' },
      { status: 500 }
    );
  }

  return json({
    amapKey: env.AMAP_KEY ?? '',
    amapSecurityCode: env.AMAP_SECURITY_CODE ?? env.AMAP_SECRET ?? ''
  });
};
