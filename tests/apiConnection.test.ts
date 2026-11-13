import {describe,expect,it} from 'vitest';
import {apiUrl,normalizeApiOrigin} from '../src/lib/apiConnection';
describe('Configuração segura da URL pública',()=>{
  it('aceita uma origem HTTPS',()=>expect(normalizeApiOrigin(' https://example.com/ ')).toBe('https://example.com'));
  it('permite localhost por HTTP',()=>expect(normalizeApiOrigin('http://localhost:8787')).toBe('http://localhost:8787'));
  it('recusa HTTP público',()=>expect(()=>normalizeApiOrigin('http://example.com')).toThrow());
  it('recusa URL com credenciais',()=>expect(()=>normalizeApiOrigin('https://abc:pass@example.com')).toThrow());
  it('recusa caminho, query e parâmetros',()=>expect(()=>normalizeApiOrigin('https://example.com/api')).toThrow());
  it('forma o endpoint correto',()=>expect(apiUrl('generate','https://example.com')).toBe('https://example.com/api/generate'));
  it('aceita URL Supabase Edge Function específica',()=>expect(normalizeApiOrigin('https://kbezscxuhqculdvraqun.supabase.co/functions/v1/framecraft-api')).toBe('https://kbezscxuhqculdvraqun.supabase.co/functions/v1/framecraft-api'));
  it('monta rotas da função Supabase',()=>expect(apiUrl('health','https://kbezscxuhqculdvraqun.supabase.co/functions/v1/framecraft-api')).toBe('https://kbezscxuhqculdvraqun.supabase.co/functions/v1/framecraft-api/api/health'));
  it('bloqueia caminhos Supabase não previstos',()=>expect(()=>normalizeApiOrigin('https://kbezscxuhqculdvraqun.supabase.co/functions/v1/qualquer-outra')).toThrow());
});
