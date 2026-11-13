import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/neutral.css',import.meta.url),'utf8');
const entry=readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8');

describe('FrameCraft minimal studio',()=>{
 it('loads the neutral design system after legacy styles',()=>{
  expect(entry).toContain("import './neutral.css'");
  expect(entry.indexOf("'./neutral.css'")).toBeGreaterThan(entry.indexOf("'./polish.css'"));
 });
 it('defines a neutral accessible color system in dark and light',()=>{
  expect(css).toContain('.app-shell.theme-dark');
  expect(css).toContain('.app-shell.theme-light');
  expect(css).toContain('--fc-surface');
  expect(css).toContain('--fc-primary-ink');
  expect(css).toContain('data-framecraft-theme');
 });
 it('uses an uncluttered default workspace',()=>{
  expect(app).toContain("const defaultPrompt='';");
  expect(app).toContain('inspectorOpen&&<Inspector');
  expect(app).toContain('templatesExpanded&&<div className="templates-strip"');
  expect(app).not.toContain('sidebar-bottom');
  expect(app).not.toContain('fc-prompt-ideas');
 });
 it('keeps manual access to editor, models, imports and settings',()=>{
  for(const text of ['Editar</button>','> Modelos</button>','> Importar JSON</button>','> Conexão da IA</button>']){
    expect(app).toContain(text);
  }
  expect(app).toContain('framecraft:theme');
  expect(app).toContain('aria-label={theme');
 });
 it('keeps the ability to generate and refine via NVIDIA',()=>{
  expect(app).toContain("apiUrl('enhance')");
  expect(app).toContain("apiUrl('generate')");
  expect(app).toContain('Ajustar com IA');
 });
});
