const STORAGE_KEY = 'framecraft.api-origin.v1';
export const API_CHANGED_EVENT = 'framecraft:api-changed';

const buildOrigin = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export function normalizeApiOrigin(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  let url: URL;
  try { url = new URL(trimmed); } catch { throw new Error('Informe uma URL completa, começando com https://.'); }
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) {
    throw new Error('Use HTTPS; HTTP é permitido somente para localhost.');
  }
  const path=url.pathname.replace(/\/+$/,'');
  const isSupabase=/^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname);
  const allowedPath=isSupabase&&path==='/functions/v1/framecraft-api';
  if (url.username || url.password || url.search || url.hash || (path&&!allowedPath)) {
    throw new Error('Use apenas a origem da API ou a URL HTTPS da função Supabase FrameCraft.');
  }
  return url.origin+(allowedPath?path:'');
}

export function getApiOrigin(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null && (stored || !/(^|\.)github\.io$/i.test(window.location.hostname))) return stored;
    } catch { /* Armazenamento indisponível: utilizar configuração de build. */ }
  }
  try { return normalizeApiOrigin(buildOrigin); } catch { return ''; }
}

export function saveApiOrigin(value: string): void {
  const normalized = normalizeApiOrigin(value);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } catch { throw new Error('O navegador bloqueou o armazenamento local desta configuração.'); }
  window.dispatchEvent(new Event(API_CHANGED_EVENT));
}

export function apiUrl(resource: string, origin = getApiOrigin()): string {
  const path = resource.replace(/^\/+/, '');
  return `${origin}/api/${path}`;
}

export function isPagesWithoutApi(): boolean {
  return typeof window !== 'undefined'
    && /(^|\.)github\.io$/i.test(window.location.hostname)
    && !getApiOrigin();
}
