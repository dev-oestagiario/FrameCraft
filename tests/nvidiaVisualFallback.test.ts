import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {generateNvidiaHero,probeVisualService,VisualProviderError,VISUAL_MODELS} from '../supabase/functions/framecraft-api/visualImage';

const request={prompt:'Um banner com hambúrguer premium',originalPrompt:'Banner para hambúrguer',format:'portrait',style:'studio'} as const;
const brief={headline:'Hambúrguer premium',heroElement:'Hambúrguer gourmet',palette:['#0A0A0A','#FF8C42']};
const generated='iVBORw0KGgo'+'A'.repeat(1400);

beforeEach(()=>{vi.stubGlobal('Deno',{env:{get:()=>undefined}})});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks()});

describe('NVIDIA visual: proteção contra falhas',()=>{
 it('usa primeiro um modelo rápido e mantém outro como alternativa documentada',()=>{
  expect(VISUAL_MODELS).toEqual([
    'black-forest-labs/flux.2-klein-4b','black-forest-labs/flux.1-schnell'
  ]);
 });
 it('tenta um modelo alternativo se o primeiro retornar HTTP 403',async()=>{
  const fetchMock=vi.fn()
    .mockResolvedValueOnce(new Response('{}',{status:403}))
    .mockResolvedValueOnce(new Response(JSON.stringify({artifacts:[{base64:generated}]}),{status:200}));
  vi.stubGlobal('fetch',fetchMock);
  const hero=await generateNvidiaHero(request,brief,'test-placeholder');
  expect(hero.model).toBe('black-forest-labs/flux.1-schnell');
  expect(hero.src.startsWith('data:image/png;base64,')).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const first=JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(first.mode).toBe('Image Generation');
  expect(first.steps).toBe(4);
  const second=JSON.parse(fetchMock.mock.calls[1][1].body);
  expect(second.mode).toBe('base');
 });
 it('identifica chave inválida sem disparar outro pedido potencialmente cobrado',async()=>{
  const fetchMock=vi.fn().mockResolvedValue(new Response('{}',{status:401}));
  vi.stubGlobal('fetch',fetchMock);
  try{await generateNvidiaHero(request,brief,'test-placeholder');throw new Error('Should have failed')}
  catch(error){
   expect(error).toBeInstanceOf(VisualProviderError);
   expect((error as VisualProviderError).code).toBe('VISUAL_UNAUTHORIZED');
   expect((error as VisualProviderError).httpStatus).toBe(424);
  }
  expect(fetchMock).toHaveBeenCalledTimes(1);
 });
 it('distingue timeouts de indisponibilidade HTTP e preserva a causa',async()=>{
  const timeout=Object.assign(new Error('timed out'),{name:'TimeoutError'});
  const fetchMock=vi.fn().mockRejectedValueOnce(timeout).mockResolvedValueOnce(new Response('{}',{status:503}));
  vi.stubGlobal('fetch',fetchMock);
  await expect(generateNvidiaHero(request,brief,'test-placeholder')).rejects.toMatchObject({
   code:'VISUAL_UPSTREAM',httpStatus:502,attempts:[
    'black-forest-labs/flux.2-klein-4b:VISUAL_TIMEOUT',
    'black-forest-labs/flux.1-schnell:HTTP_503'
   ]
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);
 });
 it('faz diagnóstico não-gerativo e não confunde HTTP 405 do HEAD com acesso autorizado',async()=>{
  const fetchMock=vi.fn().mockResolvedValue(new Response(null,{status:405}));
  vi.stubGlobal('fetch',fetchMock);
  const diag=await probeVisualService('test-placeholder');
  expect(diag.status).toBe('reachable_unverified');
  expect(diag.providerHttpStatus).toBe(405);
  expect(fetchMock.mock.calls[0][1].method).toBe('HEAD');
 });
 it('diferencia ausência de chave do serviço indisponível',async()=>{
  const diag=await probeVisualService('');
  expect(diag.status).toBe('unconfigured');
  expect(diag.configured).toBe(false);
 });
});
