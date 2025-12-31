import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cityRepository } from '$lib/server/repositories/city.repository';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const city = await cityRepository.findById(params.id);
    
    if (!city) {
      return json(
        { error: 'City not found' },
        { status: 404 }
      );
    }
    
    return json(city);
  } catch (err) {
    console.error(`GET /api/cities/${params.id} failed:`, err);
    return json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
};
