import type { NextApiRequest } from 'next';

const TOKEN_KEY = 'authToken';
const EXPIRATION_KEY = 'authExpiration';
const REFRESH_OFFSET_MS = 2 * 60 * 1000;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  if (typeof atob === 'function') {
    return atob(padded);
  }
  return Buffer.from(padded, 'base64').toString('utf8');
}

function getJwtExpiration(token: string): number | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const decoded = JSON.parse(decodeBase64Url(payload)) as { exp?: number };
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function getStoredExpiration(): number | null {
  if (!isBrowser()) return null;
  const rawExpiration = window.localStorage.getItem(EXPIRATION_KEY);
  const expiration = rawExpiration ? Number(rawExpiration) : Number.NaN;
  return Number.isFinite(expiration) ? expiration : null;
}

function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function scheduleRefresh(expiration: number | null) {
  if (!isBrowser() || !expiration) return;
  clearRefreshTimer();
  const delay = Math.max(expiration - Date.now() - REFRESH_OFFSET_MS, 0);
  refreshTimer = setTimeout(async () => {
    const userSession = window.localStorage.getItem('userSession');
    const password = window.localStorage.getItem('_rp');
    if (!userSession || !password) return;

    try {
      const parsedSession = JSON.parse(userSession) as { email?: string };
      if (!parsedSession.email) return;

      const response = await fetch('/api/fetch-token-axios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: parsedSession.email, password }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as { token?: string; token_expired?: number };
      if (data.token) {
        setToken(data.token, data.token_expired);
      }
    } catch {
      clearRefreshTimer();
    }
  }, delay);
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const expiration = getStoredExpiration() ?? getJwtExpiration(token);
  if (expiration && expiration <= Date.now()) {
    removeToken();
    return null;
  }

  return token;
}

export function setToken(token: string, expiresIn?: number): boolean {
  if (!isBrowser() || !token) return false;
  const jwtExpiration = getJwtExpiration(token);
  const expiration = expiresIn
    ? Date.now() + expiresIn * 1000
    : jwtExpiration;

  if (expiration && expiration <= Date.now()) {
    removeToken();
    return false;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
  if (expiration) {
    window.localStorage.setItem(EXPIRATION_KEY, String(expiration));
    scheduleRefresh(expiration);
  } else {
    window.localStorage.removeItem(EXPIRATION_KEY);
  }
  return true;
}

export function removeToken() {
  if (!isBrowser()) return;
  clearRefreshTimer();
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(EXPIRATION_KEY);
  window.localStorage.removeItem('_rp');
  window.localStorage.removeItem('userPermission');
}

export function getTokenFromHeaders(req: NextApiRequest): string | null {
  const authorization = req.headers.authorization;
  if (!authorization) return null;
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!header) return null;
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : header;
}

export function initTokenRefresh() {
  if (!isBrowser()) return;
  const token = getToken();
  if (!token) return;
  scheduleRefresh(getStoredExpiration() ?? getJwtExpiration(token));
}
