import { apiClient } from '$lib/api/client';
import type { AppConfig } from '$lib/types';

export function configAPI({ baseUrl = '', fetcher }: { baseUrl?: string; fetcher?: typeof fetch } = {}) {
  const client = apiClient({ baseUrl, fetcher });

  return {
    get(): Promise<AppConfig> {
      return client.requestJson<AppConfig>('/api/config');
    }
  };
}
