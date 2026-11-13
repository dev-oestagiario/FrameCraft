import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const read = (name:string)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
describe('Publicação GitHub Pages',()=>{
 it('tem base do Vite correta para /FrameCraft/',()=>{
  const vite=read('vite.config.ts');
  expect(vite).toContain("'/FrameCraft/'");
 });
 it('define favicon como asset relativo ao diretório do projeto',()=>{
  const html=read('index.html');
  expect(html).toContain('href="./favicon.svg"');
  expect(html).toContain('href="./favicon.ico"');
  expect(html).not.toContain('href="/favicon.ico"');
 });
 it('publica apenas a pasta dist criada pelo Vite',()=>{
  const workflow=read('.github/workflows/pages.yml');
  expect(workflow).toContain('GITHUB_PAGES:');
  expect(workflow).toContain('path: ./dist');
  expect(workflow).toContain('node scripts/verify-pages-build.mjs');
  expect(workflow).toContain('node scripts/verify-pages-live.mjs');
 });
 it('inclui validação explícita contra index não compilado',()=>{
  const verify=read('scripts/verify-pages-build.mjs');
  expect(verify).toContain("dist/index.html");
  expect(verify).toContain("src\\/main\\.tsx");
  expect(verify).toContain('favicon.svg');
  expect(verify).toContain('favicon.ico');
 });
});
