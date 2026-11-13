/**
 * Verify that Github Pages serves our built Vite artifact, not raw source.
 * Useful for distinguishing Pages publication-source mistakes from build errors.
 */
const root='https://dev-oestagiario.github.io/FrameCraft/';
const headers={'Accept':'text/html','Cache-Control':'no-cache'};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function check(){
  const page=await fetch(root+'?check='+Date.now(),{headers,redirect:'follow',signal:AbortSignal.timeout(15000)});
  if(!page.ok)throw new Error('GitHub Pages retornou HTTP '+page.status+' para '+root);
  const html=await page.text();
  if(/src=["']\/src\/main\.tsx["']/.test(html)){
    throw new Error('GitHub Pages está publicando o index.html DE DESENVOLVIMENTO, não o dist/. Em Settings → Pages → Build and deployment, selecione GitHub Actions.');
  }
  const assets=[...html.matchAll(/src=["'](\/FrameCraft\/assets\/[^"']+\.js)["']/g)].map(x=>x[1]);
  if(!assets.length)throw new Error('index.html publicado não referencia /FrameCraft/assets/*.js.');
  const url=new URL(assets[0],root);
  const js=await fetch(url,{signal:AbortSignal.timeout(12000)});
  if(!js.ok)throw new Error('JavaScript compilado indisponível: '+url.pathname+' HTTP '+js.status);
  const icon=await fetch(root+'favicon.svg',{signal:AbortSignal.timeout(12000)});
  if(!icon.ok)throw new Error('favicon.svg indisponível: HTTP '+icon.status);
  console.log('OK: Página compilada, JavaScript e favicon acessíveis no site público.');
}
let errors=[];
for(let attempt=1;attempt<=8;attempt++){
 try{await check();process.exit(0)}catch(error){
  errors.push(String(error.message||error));
  console.warn('Verificação '+attempt+'/8:',errors.at(-1));
  if(attempt<8)await sleep(8000);
 }
}
console.error('::error::Verificação do site público falhou: '+errors.at(-1));
console.error('Confira https://github.com/dev-oestagiario/FrameCraft/settings/pages e selecione GitHub Actions em Source.');
process.exit(1);
