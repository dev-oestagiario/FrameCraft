import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const edge=read('supabase/functions/framecraft-api/index.ts');
const app=read('src/App.tsx');
const settings=read('src/components/ApiSettingsDialog.tsx');
const model=read('supabase/functions/framecraft-api/visualImage.ts');

describe('Diagnóstico visual seguro',()=>{
 it('exige usuário autenticado para o probe e não chama quota só para verificar status',()=>{
  const route=edge.slice(edge.indexOf("if(req.method==='GET'&&path.endsWith('/api/visual-health'))"),edge.indexOf("if(req.method!=='POST'"));
  expect(route).toContain('authenticatedUser(req)');
  expect(route).toContain('probeVisualService(key)');
  expect(route).not.toContain('takeQuota(');
  expect(route).toContain('60_000');
 });
 it('não confunde presença da chave com acesso confirmado ao modelo',()=>{
  expect(edge).toContain("visualAvailability:'unverified'");
  expect(settings).toContain('A permissão do modelo só é confirmada durante uma geração');
  expect(settings).toContain("apiUrl('visual-health',origin)");
 });
 it('retorna diagnóstico estruturado e não despeja credenciais',()=>{
  expect(edge).toContain('error instanceof VisualProviderError');
  expect(edge).toContain('error.code');
  expect(edge).toContain('error.httpStatus');
  expect(model).not.toContain('console.log(apiKey)');
 });
 it('oferece recuperação visível após a falha',()=>{
  expect(app).toContain('fc-visual-recovery');
  expect(app).toContain('setVisualBlocked(true)');
  expect(app).toContain('Tentar novamente');
  expect(app).toContain('Usar vetor');
  expect(app).toContain('Enviar foto');
  expect(app).not.toContain('95_000');
 });
});
