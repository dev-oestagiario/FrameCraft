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
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Informe apenas a origem da API, sem caminho, credenciais ou parâmetros.');
  }
  return url.origin;
}

export function getApiOrigin(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return stored;
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
