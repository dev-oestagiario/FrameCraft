import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const edge=readFileSync(new URL('../supabase/functions/framecraft-api/index.ts',import.meta.url),'utf8');
const provider=readFileSync(new URL('../supabase/functions/framecraft-api/visualImage.ts',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
describe('NVIDIA image route',()=>{
 it('invokes real image generation instead of returning vector placeholders',()=>{
  expect(edge).toContain("path.endsWith('/api/generate-visual')");
  expect(edge).toContain('generateNvidiaHero(data,result.brief,key)');
  expect(provider).toContain('https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell');
  expect(provider).toContain('artifacts?.');
  expect(provider).toContain('No text, no letters');
 });
 it('is protected by user auth and quota before calling NVIDIA',()=>{
  expect(edge.indexOf('authenticatedUser(req)')).toBeLessThan(edge.lastIndexOf('generateNvidiaHero(data,result.brief,key)'));
  expect(edge.lastIndexOf('takeQuota(userId,action)')).toBeLessThan(edge.lastIndexOf('generateNvidiaHero(data,result.brief,key)'));
  expect(provider).not.toContain('nvapi-');
 });
 it('does not silently fall back to a geometric layout when the visual provider fails',()=>{
  expect(app).toContain("renderMode==='visual'&&!uploadedHero?'generate-visual':'generate'");
  expect(app).toContain('composePremiumCampaign(');
  expect(app).toContain('Nenhuma imagem foi retornada');
 });
});
