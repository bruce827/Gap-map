import type { ApiError } from '$lib/types';

export class ApiClientError extends Error {
  status: number | null;
  body: unknown;

  constructor(message: string, { status, body }: { status: number | null; body: unknown }) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.body = body;
  }
}

export type FetchLike = typeof fetch;

export interface ApiClientOptions {
  baseUrl?: string;
  fetcher?: FetchLike;
  timeoutMs?: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  timeoutMs?: number;
}

function buildQuery(query: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();

  for (const [k, v] of Object.entries(query)) {
    if (v === null || v === undefined) continue;
    params.set(k, String(v));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl) return path;
  if (baseUrl.endsWith('/') && path.startsWith('/')) return `${baseUrl.slice(0, -1)}${path}`;
  if (!baseUrl.endsWith('/') && !path.startsWith('/')) return `${baseUrl}/${path}`;
  return `${baseUrl}${path}`;
}

async function safeParseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function apiClient({ baseUrl = '', fetcher = fetch, timeoutMs = 8000 }: ApiClientOptions = {}) {
  return {
    async requestJson<T>(path: string, opts: RequestOptions = {}): Promise<T> {
      const url = joinUrl(baseUrl, `${path}${buildQuery(opts.query)}`);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? timeoutMs);

      try {
        const res = await fetcher(url, {
          method: opts.method ?? 'GET',
          headers: {
            ...(opts.body ? { 'content-type': 'application/json' } : {}),
            ...(opts.headers ?? {})
          },
          body: opts.body ? JSON.stringify(opts.body) : undefined,
          signal: controller.signal
        });

        if (!res.ok) {
          const body = await safeParseJson(res);
          const msg =
            (typeof body === 'object' && body && 'error' in body
              ? String((body as ApiError).error)
              : `HTTP ${res.status}`) || `HTTP ${res.status}`;
          throw new ApiClientError(msg, { status: res.status, body });
        }

        return (await res.json()) as T;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new ApiClientError('Request timed out', { status: null, body: null });
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }
  };
}
