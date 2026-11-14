/**
 * NVIDIA visual generation with bounded failover and explicit diagnostics.
 * NVIDIA_API_KEY stays exclusively in Supabase Edge secrets.
 * Ref: https://docs.api.nvidia.com/nim/reference/visual-models-apis
 */
import {extractArtIntent} from './subjectFidelity.ts';

type VisualInput={prompt:string;originalPrompt?:string;format:'portrait'|'square'|'story'|'landscape'|'banner';style:'studio'|'bold'|'editorial'|'minimal'|'playful'};
type VisualBrief={headline:string;subheadline?:string;concept?:string;visualDirection?:string;imagePrompt?:string;palette?:string[];heroElement?:string};
type Model={id:string;url:string;mode:'Image Generation'|'base';timeoutMs:number};
const MODELS:readonly Model[]=[
 {id:'black-forest-labs/flux.2-klein-4b',url:'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b',mode:'Image Generation',timeoutMs:42_000},
 {id:'black-forest-labs/flux.1-schnell',url:'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell',mode:'base',timeoutMs:34_000},
];
export const VISUAL_MODEL=MODELS[0].id;
export const VISUAL_MODELS=MODELS.map(m=>m.id);
const MAX_BASE64=4_700_000;
const cut=(text:string,max:number)=>text.trim().slice(0,max);
export type VisualFailureCode='VISUAL_TIMEOUT'|'VISUAL_NETWORK'|'VISUAL_UNAUTHORIZED'|'VISUAL_FORBIDDEN'|'VISUAL_NOT_FOUND'|'VISUAL_RATE_LIMIT'|'VISUAL_INVALID_REQUEST'|'VISUAL_UPSTREAM'|'VISUAL_INVALID_RESPONSE'|'VISUAL_UNAVAILABLE';
export class VisualProviderError extends Error{
 constructor(message:string,public readonly code:VisualFailureCode,public readonly httpStatus:number,public readonly model:string,public readonly attempts:string[]=[]){
  super(message);this.name='VisualProviderError';
 }
}
export function buildVisualPrompt(input:VisualInput,brief:VisualBrief):string{
 const original=input.originalPrompt||input.prompt;
 const intent=extractArtIntent(original,input.prompt);
 const food=/\b(hamb[úu]rguer|burger|pizza|lanche|gastronomia|comida|prato|restaurante|sobremesa|sorvete|café)\b/i.test(original);
 const illustration=/\b(sem fotos?|nenhuma fotografia|não usar fotografias?|render 3d|3d estilizado|ilustra[çc][ãa]o)\b/i.test(original);
 const subject=food?(/hamb[úu]rguer|burger/i.test(original)
  ?'a beautiful recognizable premium gourmet hamburger with golden bun, melted cheese, grilled patty, lettuce and sauce'
  :'the precise dish requested in the original user brief, recognizable, delicious and thoughtfully styled')
  :(intent.brand||((intent.subject!=='Assunto descrito pelo usuário')?intent.subject:(brief.heroElement||'the user requested product')));
 const medium=illustration
  ?'Premium stylized 3D product render, tactile physically believable materials, beautiful studio lighting, richly detailed, no stock photos.'
  :food?'Premium commercial food photography, appetizing natural food texture, soft studio highlights and professional advertising optics.'
  :'High-end product-advertising render, recognizable subject, cinematic studio lighting, tactile detail and depth.';
 const mood=input.style==='minimal'?'restrained minimal backdrop':input.style==='bold'?'high contrast dramatic campaign':'elegant art direction';
 return [
  'Create only the IMAGE/HERO of a premium advertising poster, WITHOUT any typography.',
  'PRIMARY SUBJECT: '+subject+'. Instantly recognizable, visually dominant, centered in the image.',
  medium,mood,'ORIGINAL USER INTENT: '+cut(original,1000),
  'VISUAL ART DIRECTION: '+cut(brief.visualDirection||brief.concept||'',400),
  'HERO: '+cut(brief.heroElement||brief.imagePrompt||'',400),
  'PALETTE: '+(brief.palette||[]).filter(x=>/^#[0-9a-fA-F]{6}$/.test(x)).slice(0,5).join(', '),
  'Make convincing materials and controlled lighting the central attraction; keep upper and lower edges visually quiet for editable copy.',
  'No text, no letters, no logos, no UI, no captions, no watermarks, no generic geometric substitute.',
  'One cohesive composition, commercial polish, no collage.'
 ].join('\n').slice(0,7500);
}
function classify(status:number,model:string):VisualProviderError{
 if(status===401)return new VisualProviderError('A NVIDIA rejeitou a chave de API (HTTP 401). Verifique NVIDIA_API_KEY no Supabase.','VISUAL_UNAUTHORIZED',424,model);
 if(status===403)return new VisualProviderError('A conta NVIDIA não possui acesso a '+model+' (HTTP 403). Envie uma foto ou escolha o modo vetorial.','VISUAL_FORBIDDEN',424,model);
 if(status===404)return new VisualProviderError('A NVIDIA não disponibiliza '+model+' neste endpoint (HTTP 404).','VISUAL_NOT_FOUND',503,model);
 if(status===429)return new VisualProviderError('A cota de imagens da NVIDIA foi atingida (HTTP 429).','VISUAL_RATE_LIMIT',429,model);
 if(status===400||status===422)return new VisualProviderError('A NVIDIA não aceitou os parâmetros de '+model+' (HTTP '+status+').','VISUAL_INVALID_REQUEST',502,model);
 return new VisualProviderError('O serviço NVIDIA respondeu HTTP '+status+' para '+model+'.','VISUAL_UPSTREAM',502,model);
}
function networkError(error:unknown,model:string):VisualProviderError{
 const name=error instanceof Error?error.name:'UnknownError';
 if(name==='TimeoutError'||name==='AbortError'){
  return new VisualProviderError('A NVIDIA demorou demais para gerar a imagem em '+model+'. Você pode tentar novamente ou enviar uma foto.','VISUAL_TIMEOUT',504,model);
 }
 return new VisualProviderError('Não foi possível estabelecer conexão HTTPS com a NVIDIA ('+name+'). Verifique o status do provedor ou utilize uma foto enviada.','VISUAL_NETWORK',503,model);
}
function imageFromPayload(payload:unknown,model:string){
 if(!payload||typeof payload!=='object')throw new VisualProviderError('Resposta sem dados de imagem da NVIDIA.','VISUAL_INVALID_RESPONSE',502,model);
 const body=payload as {artifacts?:{base64?:unknown}[];data?:{b64_json?:unknown}[]};
 const blob=body.artifacts?.[0]?.base64??body.data?.[0]?.b64_json;
 if(typeof blob!=='string'||!blob.trim())throw new VisualProviderError('O modelo retornou resposta válida, mas nenhuma imagem utilizável.','VISUAL_INVALID_RESPONSE',502,model);
 const clean=blob.replace(/^data:image\/(?:png|jpeg|webp);base64,/i,'').replace(/\s/g,'');
 if(clean.length<1000||clean.length>MAX_BASE64||!/^[a-zA-Z0-9+/]+={0,2}$/.test(clean)){
  throw new VisualProviderError('Imagem retornada inválida ou acima do limite de tamanho do editor.','VISUAL_INVALID_RESPONSE',502,model);
 }
 const mime=clean.startsWith('iVBORw0KGgo')?'image/png':clean.startsWith('UklGR')?'image/webp':clean.startsWith('/9j/')?'image/jpeg':null;
 if(!mime)throw new VisualProviderError('Formato de imagem não reconhecido.','VISUAL_INVALID_RESPONSE',502,model);
 return 'data:'+mime+';base64,'+clean;
}
function preferredModels(){
 const runtime=globalThis as unknown as {Deno?:{env?:{get:(key:string)=>string|undefined}}};
 const custom=runtime.Deno?.env?.get('NVIDIA_IMAGE_MODEL')||'auto';
 const preferred=MODELS.find(m=>m.id===custom);
 return preferred?[preferred,...MODELS.filter(m=>m.id!==custom)]:[...MODELS];
}
/**
 * A HEAD probe is deliberately non-generative. HTTP 400/404/405/422 on HEAD
 * does NOT prove image permission; actual access is only confirmed by inference.
 */
export async function probeVisualService(apiKey:string):Promise<{configured:boolean;status:string;model:string;providerHttpStatus?:number;message:string}>{
 const model=preferredModels()[0];
 if(!apiKey)return {configured:false,status:'unconfigured',model:model.id,message:'Configure NVIDIA_API_KEY nos secrets do Supabase.'};
 try{
  const res=await fetch(model.url,{method:'HEAD',headers:{Authorization:'Bearer '+apiKey},signal:AbortSignal.timeout(7000)});
  const reachable=res.status>=100;
  return {configured:true,status:res.status===401||res.status===403?'access_unverified':'reachable_unverified',
   model:model.id,providerHttpStatus:res.status,
   message:reachable?'Servidor da NVIDIA acessível; acesso ao modelo somente é confirmado por uma geração real.':'Não foi possível confirmar a disponibilidade do modelo.'};
 }catch(error){
  const diagnostic=networkError(error,model.id);
  return {configured:true,status:diagnostic.code==='VISUAL_TIMEOUT'?'timeout':'network_error',
   model:model.id,message:diagnostic.message};
 }
}
export async function generateNvidiaHero(input:VisualInput,brief:VisualBrief,apiKey:string):
 Promise<{src:string;model:string;description:string}>{
 const prompt=buildVisualPrompt(input,brief);
 const attempts:string[]=[];
 let last:VisualProviderError|null=null;
 for(const model of preferredModels()){
  let res:Response;
  try{
   res=await fetch(model.url,{
    method:'POST',
    headers:{Authorization:'Bearer '+apiKey,Accept:'application/json','Content-Type':'application/json'},
    body:JSON.stringify({prompt,mode:model.mode,samples:1,seed:0,steps:4,cfg_scale:0,width:1024,height:1024,image:null}),
    signal:AbortSignal.timeout(model.timeoutMs),
   });
  }catch(error){
   last=networkError(error,model.id);
   attempts.push(model.id+':'+last.code);
   continue; // switch model once; never repeat the same potentially billed request
  }
  if(!res.ok){
   last=classify(res.status,model.id);
   attempts.push(model.id+':HTTP_'+res.status);
   if(res.status===401||res.status===429)break;
   continue;
  }
  let payload:unknown;
  try{payload=await res.json()}catch{
   last=new VisualProviderError('A NVIDIA retornou JSON inválido para '+model.id+'.','VISUAL_INVALID_RESPONSE',502,model.id);
   attempts.push(model.id+':INVALID_JSON');
   continue;
  }
  try{
   const src=imageFromPayload(payload,model.id);
   return {src,model:model.id,description:'Hero de campanha gerado pelo modelo visual '+model.id};
  }catch(error){
   last=error instanceof VisualProviderError?error:new VisualProviderError('Resposta visual inválida.','VISUAL_INVALID_RESPONSE',502,model.id);
   attempts.push(model.id+':'+last.code);
  }
 }
 if(!last)throw new VisualProviderError('Nenhum modelo de imagem NVIDIA foi configurado.','VISUAL_UNAVAILABLE',503,'');
 const suffix=attempts.length>1?' Tentativas: '+attempts.join(' · ')+'.':'';
 throw new VisualProviderError(last.message+suffix,last.code,last.httpStatus,last.model,attempts);
}
