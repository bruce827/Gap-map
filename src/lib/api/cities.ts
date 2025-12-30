import { apiClient } from '$lib/api/client';
import type { City } from '$lib/types';

export function citiesAPI({ baseUrl = '', fetcher }: { baseUrl?: string; fetcher?: typeof fetch } = {}) {
  const client = apiClient({ baseUrl, fetcher });

  return {
    list(): Promise<City[]> {
      return client.requestJson<City[]>('/api/cities');
    },

    getById(id: string): Promise<City | null> {
      return client.requestJson<City | null>(`/api/cities/${encodeURIComponent(id)}`);
    },

    search(q: string, { limit = 50 }: { limit?: number } = {}): Promise<City[]> {
      return client.requestJson<City[]>('/api/cities/search', { query: { q, limit } });
    }
  };
}
