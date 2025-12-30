import { json } from '@sveltejs/kit';
import { cityRepository } from '$lib/server/repositories/city.repository';

export const GET = async () => {
  try {
    const cities = await cityRepository.findAll();
    return json(cities);
  } catch (err) {
    console.error('GET /api/cities failed:', err);
    return json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
};
