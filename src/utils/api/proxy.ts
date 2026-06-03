import type { NextApiRequest } from 'next';
import { getTokenFromHeaders } from '@/utils/headers/token';

export async function parseUpstreamResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function bearerHeaders(req: NextApiRequest): HeadersInit {
  const token = getTokenFromHeaders(req);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function appendQueryParams(url: string, query: NextApiRequest['query']) {
  const targetUrl = new URL(url);
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => targetUrl.searchParams.append(key, entry));
      return;
    }
    if (typeof value !== 'undefined') {
      targetUrl.searchParams.set(key, value);
    }
  });
  return targetUrl.toString();
}
