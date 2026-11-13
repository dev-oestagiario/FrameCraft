import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const edge=readFileSync(new URL('../supabase/functions/framecraft-api/index.ts',import.meta.url),'utf8');
const composer=readFileSync(new URL('../src/lib/proComposer.ts',import.meta.url),'utf8');
const edgeComposer=readFileSync(new URL('../supabase/functions/framecraft-api/proComposer.ts',import.meta.url),'utf8');
const intent=readFileSync(new URL('../src/lib/subjectFidelity.ts',import.meta.url),'utf8');
const edgeIntent=readFileSync(new URL('../supabase/functions/framecraft-api/subjectFidelity.ts',import.meta.url),'utf8');
describe('Pipeline profissional de imagem',()=>{
 it('substitui o prompt na mesma caixa mantendo o original',()=>{
  expect(app).toContain('setPrompt(result.enhancedPrompt.slice(0,8500))');
  expect(app).toContain('setOriginalPrompt(previous=>previous||prompt.slice(0,3000))');
  expect(app).toContain('originalPrompt:originalPrompt||undefined');
  expect(app).not.toContain('fc-enhanced-panel');
 });
 it('usa os mesmos contratos em Node, React e Supabase Edge',()=>{
  expect(edgeComposer).toBe(composer);
  expect(edgeIntent).toBe(intent);
 });
 it('aplica a identidade da peça sem expor o token NVIDIA no cliente',()=>{
  expect(edge).toContain('extractArtIntent');
  expect(edge).toContain('enforceSubjectFidelity');
  expect(edge).toContain('authenticatedUser');
  expect(edge).toContain('takeQuota');
  expect(app).not.toContain('NVIDIA_API_KEY=');
 });
});
