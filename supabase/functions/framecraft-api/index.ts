/**
 * FrameCraft HTTPS API · Supabase Edge Functions (Deno)
 * IMPORTANT: Never deploy NVIDIA_API_KEY to GitHub Pages.
 * Generation requires a separately configured FRAMECRAFT_ACCESS_TOKEN secret.
 */
import {auditProfessionalDesign,composeProfessionalDesign,type PosterBrief,type PosterStyle,type PosterFormat} from './proComposer.ts';

const ALLOWED_ORIGINS=new Set([
 'https://dev-oestagiario.github.io','http://localhost:5173','http://127.0.0.1:5173'
]);
const FREE_TRIAL_MODELS=[
 'nvidia/nemotron-3.5-lightning-30b-a3b',
 'nvidia/nemotron-3.5-bolt-e4b',
 'nvidia/nemotron-3.5-super-vl-120b-a12b',
];
const recentCalls:number[]=[];
const json=(body:unknown,status=200,origin?:string|null)=>{
 const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
 if(origin&&ALLOWED_ORIGINS.has(origin)){
  headers.set('Access-Control-Allow-Origin',origin);
  headers.set('Vary','Origin');
  headers.set('Access-Control-Allow-Headers','authorization, content-type');
  headers.set('Access-Control-Allow-Methods','OPTIONS, GET, POST');
 }
 return new Response(JSON.stringify(body),{status,headers});
};
function safeTokenMatch(actual:string,expected:string):boolean{
 if(!expected || actual.length!==expected.length)return false;
 let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i);
 return diff===0;
}
function parseJSON(text:string):Record<string,unknown>{
 const cleaned=text.replace(/<think>[\s\S]*?<\/think>/gi,'').trim();
 const fence=cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
 const source=fence?.[1]?.trim()??cleaned;
 const left=source.indexOf('{'),right=source.lastIndexOf('}');
 if(left<0||right<=left)throw new Error('A NVIDIA não enviou um objeto JSON.');
 const obj=JSON.parse(source.slice(left,right+1)) as unknown;
 if(!obj||typeof obj!=='object'||Array.isArray(obj))throw new Error('A NVIDIA enviou formato inesperado.');
 return obj as Record<string,unknown>;
}
function text(value:unknown,defaultValue:string,max:number):string{
 const v=typeof value==='string'?value.replace(/\s+/g,' ').trim():'';
 return (v||defaultValue).slice(0,max);
}
function safeBrief(raw:Record<string,unknown>,request:string):PosterBrief&Record<string,unknown>{
 const stripped=request.replace(/\s+/g,' ').trim();
 const palette=(Array.isArray(raw.palette)?raw.palette:[]).filter((c):c is string=>typeof c==='string'&&/^#[a-f\d]{6}$/i.test(c)).slice(0,6);
 const cta=text(raw.callToAction,'Saiba mais',65);
 const invalidFreeClaim=/\b(grátis|gratuito|free|sem custo|free trial)\b/i.test(cta)&&!/\b(grátis|gratuito|free|sem custo|free trial)\b/i.test(stripped);
 return {
  concept:text(raw.concept,'Composição profissional centrada na mensagem.',300),
  audience:text(raw.audience,'Público interessado no assunto',160),
  headline:text(raw.headline,stripped.slice(0,65),115),
  subheadline:text(raw.subheadline,'',165),
  visualDirection:text(raw.visualDirection,'Hierarquia editorial de alto contraste, leitura clara e geometria autoral.',650),
  typography:text(raw.typography,'Tipografia com pesos distintos, poucas linhas e contraste forte.',280),
  palette:palette.length>=2?palette:['#0B1C24','#68EAC0','#F8FFF9'],
  hierarchy:text(raw.hierarchy,'Título dominante, mensagem breve, foco gráfico e CTA.',320),
  imagePrompt:text(raw.imagePrompt,'',700),
  callToAction:invalidFreeClaim?'Saiba mais':cta,
 };
}
type GenerateInput={prompt:string;style:PosterStyle;format:PosterFormat;instruction?:string};
function isInput(data:unknown):data is GenerateInput{
 if(!data||typeof data!=='object')return false;
 const obj=data as Record<string,unknown>;
 return typeof obj.prompt==='string'&&obj.prompt.trim().length>=8&&obj.prompt.length<=3000
  &&['studio','bold','editorial','minimal','playful'].includes(String(obj.style))
  &&['portrait','square','story','landscape','banner'].includes(String(obj.format))
  &&(obj.instruction===undefined||(typeof obj.instruction==='string'&&obj.instruction.length<=1200));
}
async function nvidiaBrief(input:GenerateInput,apiKey:string):Promise<{brief:PosterBrief&Record<string,unknown>;model:string}>{
 const system=`Você é um diretor de arte sênior de um estúdio internacional. Converta uma descrição informal em briefing estratégico e um plano visual altamente específico. Sua resposta é APENAS UM JSON com os campos: concept, audience, headline, subheadline, visualDirection, typography, palette (lista de cores #RRGGBB), hierarchy, imagePrompt, callToAction. O headline deve ser curto (ideal 25-55 caracteres), contendo a promessa real mais importante, sem inventar marcas nem dados. O subheadline deve ter no máximo 110 caracteres. A direção visual descreve composição autoral, contraste acessível, ritmo, proporção, elementos gráficos geométricos, área segura, dimensões e tipografia. Nunca invente preços, avaliações, desconto, 'grátis' ou funcionalidade não declarada. Evite UI falsa, microtextos, listas densas, pequenos cartões e áreas vazias excessivas. Use português do Brasil. Forme um único foco visual. Represente apenas texto, formas e geometria porque o renderizador não cria fotografias. Entregue JSON, não código ou Markdown.`;
 const user=`DESCRIÇÃO DO USUÁRIO: ${input.prompt}\nESTILO: ${input.style}\nFORMATO: ${input.format}\nREVISÃO: ${input.instruction||'primeira criação'}\nFaça a direção de arte profissional obedecendo ao conteúdo solicitado.`;
 const preferred=Deno.env.get('NVIDIA_MODEL');
 const candidates=[...(preferred&&preferred!=='auto'?[preferred]:[]),...FREE_TRIAL_MODELS];
 let lastError='Nenhum modelo respondeu';
 for(const model of [...new Set(candidates)].slice(0,4)){
  for(const jsonMode of [true,false]){
   let response:Response;
   try{
    response=await fetch('https://integrate.api.nvidia.com/v1/chat/completions',{
     method:'POST',signal:AbortSignal.timeout(42000),
     headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},
     body:JSON.stringify({
      model,messages:[{role:'system',content:system},{role:'user',content:user}],
      temperature:.45,top_p:.9,max_tokens:2400,stream:false,
      ...(model.includes('nemotron')?{chat_template_kwargs:{enable_thinking:false}}:{}),
      ...(jsonMode?{response_format:{type:'json_object'}}:{}),
     }),
    });
   }catch{lastError=`${model}: erro de conexão com a NVIDIA`;break}
   if(response.status===401)throw new Error('A chave NVIDIA configurada no Supabase não foi aceita.');
   if(response.status===429)throw new Error('Limite de requisições NVIDIA atingido. Confira sua cota gratuita.');
   if(!response.ok){lastError=`${model}: HTTP ${response.status}`;if(response.status===400&&jsonMode)continue;break}
   try{
    const reply=await response.json() as {choices?:Array<{message?:{content?:string}}>} ;
    const content=reply.choices?.[0]?.message?.content;
    if(!content){lastError=`${model}: resposta sem conteúdo`;continue}
    return {brief:safeBrief(parseJSON(content),input.prompt),model};
   }catch{lastError=`${model}: resposta não foi um briefing JSON válido`;if(jsonMode)continue}
  }
 }
 throw new Error(`Não foi possível produzir briefing com a NVIDIA. ${lastError}`);
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin');
 if(origin&&!ALLOWED_ORIGINS.has(origin))return json({error:'Origem não autorizada.'},403);
 if(req.method==='OPTIONS'){
  if(!origin)return new Response(null,{status:204});
  return new Response(null,{status:204,headers:{
   'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'OPTIONS, GET, POST',
   'Access-Control-Allow-Headers':'authorization, content-type','Access-Control-Max-Age':'86400','Vary':'Origin'
  }});
 }
 const key=Deno.env.get('NVIDIA_API_KEY')||'';
 const accessToken=Deno.env.get('FRAMECRAFT_ACCESS_TOKEN')||'';
 const path=new URL(req.url).pathname;
 if(req.method==='GET' && path.endsWith('/api/health')){
  return json({status:'ok',configured:Boolean(key),secured:Boolean(accessToken)},200,origin);
 }
 if(req.method==='GET' && path.endsWith('/api/models')){
  return json({configured:Boolean(key),secured:Boolean(accessToken),selected:null,catalogAccessible:false},200,origin);
 }
 if(req.method!=='POST'||!path.endsWith('/api/generate'))return json({error:'Rota não encontrada'},404,origin);
 // Critical: both secrets must be configured. Without an access token,
 // the site must NEVER become an open paid-model proxy.
 if(accessToken.length<24)return json({error:'Configure FRAMECRAFT_ACCESS_TOKEN com ao menos 24 caracteres em Supabase > Edge Functions > Secrets.'},503,origin);
 const supplied=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||'';
 if(!safeTokenMatch(supplied,accessToken))return json({error:'Token de acesso inválido. Configure o token no painel Conexão.'},401,origin);
 if(!key)return json({error:'Configure NVIDIA_API_KEY no Supabase Edge Functions > Secrets.'},503,origin);
 const now=Date.now();for(let i=recentCalls.length-1;i>=0;i--)if(now-recentCalls[i]>60_000)recentCalls.splice(i,1);
 if(recentCalls.length>=5)return json({error:'Limite de 5 gerações por minuto nesta instância. Tente novamente em instantes.'},429,origin);
 recentCalls.push(now);
 const raw=await req.text();
 if(raw.length>12_000)return json({error:'Solicitação acima do tamanho permitido.'},413,origin);
 let data:unknown;
 try{data=JSON.parse(raw)}catch{return json({error:'JSON de entrada inválido.'},400,origin)}
 if(!isInput(data))return json({error:'Informe descrição (8 a 3000 caracteres), estilo e formato válidos.'},422,origin);
 try{
  const {brief,model}=await nvidiaBrief(data,key);
  const design=composeProfessionalDesign(brief,data.prompt,data.style,data.format);
  const issues=auditProfessionalDesign(design);
  return json({brief,design,model,modelMode:'automatic',
   repairs:issues.length?['A composição foi normalizada pela direção de arte.']:[]},200,origin);
 }catch(error){
  const message=error instanceof Error?error.message:'Falha na geração';
  console.error('FrameCraft generate:',message);
  const status=/cota|limite/.test(message.toLowerCase())?429:502;
  return json({error:message},status,origin);
 }
});
