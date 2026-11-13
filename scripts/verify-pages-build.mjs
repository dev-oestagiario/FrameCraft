import {existsSync, readFileSync} from 'node:fs';
import {resolve, sep} from 'node:path';

const base = '/FrameCraft/';
const htmlPath = resolve('dist/index.html');
if (!existsSync(htmlPath)) throw new Error('O build não produziu dist/index.html.');

const html = readFileSync(htmlPath, 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    console.error('::error::' + message);
    process.exitCode = 1;
  }
};

assert(!/(?:src|href)=["']\/src\/main\.tsx["']/.test(html),
  'Entrada de desenvolvimento /src/main.tsx encontrada no build. Não publique o index.html da raiz.');
assert(!html.includes('%BASE_URL%'), 'O Vite não substituiu %BASE_URL%.');
const refs = [...html.matchAll(/(?:src|href)=["']([^"'#?]+)["']/g)].map(match => match[1]);
const js = refs.filter(ref => ref.endsWith('.js'));
assert(js.length > 0, 'Nenhum arquivo JavaScript compilado foi referenciado pelo index.html.');
assert(js.every(ref => ref.startsWith(base+'assets/')),
  'O JavaScript deve referenciar /FrameCraft/assets/*.js.');

for (const asset of refs) {
  // The favicon is relative to the site subdirectory, not the domain root.
  const local = asset.startsWith(base) ? asset.slice(base.length) :
    asset.startsWith('./') ? asset.slice(2) : null;
  if (local === null) continue;
  const path = resolve('dist',local);
  assert(path.startsWith(resolve('dist')+sep) && existsSync(path),
    'Referência não encontrada no artefato de deploy: '+asset);
}
for (const icon of ['favicon.svg','favicon.ico']) {
  assert(existsSync(resolve('dist',icon)), 'Favicon ausente em dist/'+icon);
}
if (!process.exitCode) console.log('OK: JS compilado, base /FrameCraft/, CSS e ícones presentes em dist/.');
