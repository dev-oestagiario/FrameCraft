/**
 * FrameCraft HTTPS API · Supabase Edge Functions (Deno)
 * IMPORTANT: Never deploy NVIDIA_API_KEY to GitHub Pages.
 * Generation requires verified Supabase email sessions with database-enforced quotas.
 */
import {auditProfessionalDesign,composeProfessionalDesign,type PosterBrief,type PosterStyle,type PosterFormat} from './proComposer.ts';
import {extractArtIntent,enforceSubjectFidelity} from './subjectFidelity.ts';

const ALLOWED_ORIGINS=new Set([
 'https://dev-oestagiario.github.io','http://localhost:5173','http://127.0.0.1:5173'
]);
const FREE_TRIAL_MODELS=[
 'nvidia/nemotron-3.5-lightning-30b-a3b',
 'nvidia/nemotron-3.5-bolt-e4b',
 'nvidia/nemotron-3.5-super-vl-120b-a12b',
];
const json=(body:unknown,status=200,origin?:string|null)=>{
 const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
 if(origin&&ALLOWED_ORIGINS.has(origin)){
  headers.set('Access-Control-Allow-Origin',origin);
  headers.set('Vary','Origin');
  headers.set('Access-Control-Allow-Headers','authorization, content-type, apikey');
  headers.set('Access-Control-Allow-Methods','OPTIONS, GET, POST');
 }
 return new Response(JSON.stringify(body),{status,headers});
};
const SB_URL=Deno.env.get('SUPABASE_URL')||'https://kbezscxuhqculdvraqun.supabase.co';
const ANON_KEY=Deno.env.get('SUPABASE_ANON_KEY')||'';
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
async function authenticatedUser(req:Request):Promise<string|null>{
 const token=req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]||'';
 if(!ANON_KEY||!token||token.length>4096)return null;
 try{
  const res=await fetch(SB_URL+'/auth/v1/user',{headers:{apikey:ANON_KEY,Authorization:'Bearer '+token},signal:AbortSignal.timeout(8000)});
  if(!res.ok)return null;
  const user=await res.json() as {id?:string;email_confirmed_at?:string;is_anonymous?:boolean};
  if(!user.id||!user.email_confirmed_at||user.is_anonymous)return null;
  return user.id;
 }catch{return null}
}
async function takeQuota(uid:string,action:'enhance'|'generate'):Promise<{allowed:boolean;reason?:string;remainingToday?:number}>{
 if(!SERVICE_KEY)throw new Error('Cota indisponível: service role não configurada.');
 const res=await fetch(SB_URL+'/rest/v1/rpc/framecraft_consume_ai_quota',{
  method:'POST',
  headers:{'Content-Type':'application/json',apikey:SERVICE_KEY,Authorization:'Bearer '+SERVICE_KEY},
  body:JSON.stringify({p_user_id:uid,p_action:action}),signal:AbortSignal.timeout(9000)
 });
 if(!res.ok)throw new Error('Controle de cota não disponível; geração bloqueada para proteção da NVIDIA.');
 return await res.json() as {allowed:boolean;reason?:string;remainingToday?:number};
}
function detailedPrompt(input:GenerateInput,brief:PosterBrief,raw:Record<string,unknown>):string{
 const original=input.originalPrompt||input.prompt;
 const intent=extractArtIntent(original,input.prompt);
 const direct=typeof raw.enhancedPrompt==='string'?raw.enhancedPrompt.trim():'';
 if(direct.length>=650&&direct.length<=8500)return enforceSubjectFidelity(input.prompt,direct,original);
 const dims={portrait:'1080×1350',square:'1080×1080',story:'1080×1920',landscape:'1920×1080',banner:'1200×630'}[input.format];
 return [
  'DIREÇÃO DE ARTE PROFISSIONAL / FRAMECRAFT',
  'CONTEXTO ORIGINAL: '+original,
  'ASSUNTO OBRIGATÓRIO: '+intent.subject+'. MARCA: '+intent.brand+'. Não trocar por abstrações genéricas.',
  'INTENÇÃO: '+intent.renderIntent+'. HERO: '+(brief.heroElement||'elemento visual que representa inequivocamente o produto')+'.',
  'OBJETIVO: '+brief.concept+'. Não criar fatos, funcionalidades, preços nem promessas que não estejam no pedido.',
  'PÚBLICO E TOM: '+String((brief as Record<string,unknown>).audience||'Público interessado na mensagem')+'. Redação clara e adequada à marca.',
  'TELA E FORMATO: '+dims+' pixels; estilo '+input.style+'; respeitar margem segura de 7% em todos os lados.',
  'COPY E ESTRUTURA: headline '+JSON.stringify(brief.headline)+'; linha de apoio '+JSON.stringify(brief.subheadline||'apenas se necessária')+'; chamada para ação '+JSON.stringify(brief.callToAction)+'.',
  'DIREÇÃO ARTÍSTICA: '+String((brief as Record<string,unknown>).visualDirection||'Composição editorial de alto contraste')+'. Hierarquia forte, uma área visual focal e equilíbrio geométrico.',
  'HIERARQUIA: '+String((brief as Record<string,unknown>).hierarchy||'Manchete dominante, apoio sucinto, CTA ancorado')+'. Não usar microtexto, pequenos cards em série ou blocos longos.',
  'TIPOGRAFIA: '+String((brief as Record<string,unknown>).typography||'Tipografia expressiva e legível')+'. Manchete dominante, secundário com leitura fácil em miniatura, no máximo duas famílias.',
  'CORES E CONTRASTE: '+(Array.isArray(brief.palette)?brief.palette.join(', '):'#0B1C24, #68EAC0, #F8FFF9')+'. Garantir contraste de texto, consistência e impacto intencional.',
  'ELEMENTOS VISUAIS: geometria vetorial editável, linhas, formas orgânicas simplificadas, círculos, estrelas ou polígonos; evitar interface fictícia.',
  'CRITÉRIOS DE QUALIDADE: evitar cortes, excesso de espaço vazio, sobreposição, texto menor que 28px, CTA ilegível e conteúdo inventado.',
  'ENTREGA: composição estruturada em JSON editável com textos, gradientes, retângulos, elipses, linhas, estrelas e polígonos.',
  input.instruction?'INSTRUÇÃO ADICIONAL: '+input.instruction:'RESULTADO ESPERADO: peça visual profissional com composição memorável.'
 ].join('\n\n').slice(0,8500);
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
 const intent=extractArtIntent(request);
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
  subject:intent.subject,brand:intent.brand,renderIntent:intent.renderIntent,
  mustInclude:intent.mustInclude,heroElement:text(raw.heroElement,
     intent.kind==='console'?'silhueta vetorial reconhecível do console solicitado':'elemento principal relacionado ao tema',240),
 };
}
type GenerateInput={prompt:string;style:PosterStyle;format:PosterFormat;instruction?:string;enhancedPrompt?:string;originalPrompt?:string};
function isInput(data:unknown):data is GenerateInput{
 if(!data||typeof data!=='object')return false;
 const obj=data as Record<string,unknown>;
 return typeof obj.prompt==='string'&&obj.prompt.trim().length>=2&&obj.prompt.length<=8500
  &&['studio','bold','editorial','minimal','playful'].includes(String(obj.style))
  &&['portrait','square','story','landscape','banner'].includes(String(obj.format))
  &&(obj.instruction===undefined||(typeof obj.instruction==='string'&&obj.instruction.length<=1200))
  &&(obj.enhancedPrompt===undefined||(typeof obj.enhancedPrompt==='string'&&obj.enhancedPrompt.length<=8500))
  &&(obj.originalPrompt===undefined||(typeof obj.originalPrompt==='string'&&obj.originalPrompt.length<=3000));
}
async function nvidiaBrief(input:GenerateInput,apiKey:string):Promise<{brief:PosterBrief&Record<string,unknown>;enhancedPrompt:string;model:string}>{
 const intent=extractArtIntent(input.originalPrompt||input.prompt,input.prompt);
 const system=`Você é um diretor de arte sênior de um estúdio internacional. Converta uma descrição informal em briefing estratégico e um plano visual altamente específico. Sua resposta é APENAS UM JSON com os campos: concept, audience, headline, subheadline, visualDirection, typography, palette (lista de cores #RRGGBB), hierarchy, imagePrompt, callToAction, enhancedPrompt, heroElement, brand, subject, mustInclude, renderIntent. REGRA PRIORITÁRIA: preservar marca e sujeito original. Pedido de banner do PS5 exige PS5/PlayStation 5 em copy, hero e briefing — mesmo que o usuário peça abstração e proíba fotografia. Não substituir PS5 por 'gaming', 'performance' ou formas sem ligação ao tema. Um banner de campanha precisa de um elemento hero reconhecível, escala dramática, espaço negativo intencional e informação fiel; não usar o mesmo template universal. O campo enhancedPrompt deve conter entre 900 e 3500 caracteres de direção de arte aprofundada em português brasileiro com seções OBJETIVO, PÚBLICO, COPY, FORMATO, GRID, ALINHAMENTO, MARGENS, TIPOGRAFIA, PALETA, CONTRASTE, ELEMENTOS VETORIAIS, ACABAMENTO, RESTRIÇÕES, PRODUÇÃO E CONTROLE DE QUALIDADE. Especifique os elementos e sua distribuição, sem inventar fatos. O headline deve ser curto (ideal 25-55 caracteres), contendo a promessa real mais importante, sem inventar marcas nem dados. O subheadline deve ter no máximo 110 caracteres. A direção visual descreve composição autoral, contraste acessível, ritmo, proporção, elementos gráficos geométricos, área segura, dimensões e tipografia. Nunca invente preços, avaliações, desconto, 'grátis' ou funcionalidade não declarada. Evite UI falsa, microtextos, listas densas, pequenos cartões e áreas vazias excessivas. Use português do Brasil. Forme um único foco visual. Represente apenas texto, formas e geometria porque o renderizador não cria fotografias. Entregue JSON, não código ou Markdown.`;
 const user=`SOLICITAÇÃO ORIGINAL INALTERÁVEL: ${input.originalPrompt||input.prompt}\nASSUNTO OBRIGATÓRIO: ${intent.subject}\nMARCA: ${intent.brand||'não especificada'}\nINCLUIR: ${intent.mustInclude.join(', ')}\nINTENÇÃO VISUAL: ${intent.renderIntent}\nDESCRIÇÃO DO USUÁRIO: ${input.prompt}\nESTILO: ${input.style}\nFORMATO: ${input.format}\nREVISÃO: ${input.instruction||'primeira criação'}\n${input.enhancedPrompt?`PROMPT EDITADO PELO USUÁRIO: ${input.enhancedPrompt.slice(0,8500)}`:''}\nFaça a direção de arte profissional obedecendo ao conteúdo solicitado.`;
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
      temperature:.45,top_p:.9,max_tokens:3700,stream:false,
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
    const raw=parseJSON(content);const brief=safeBrief(raw,input.originalPrompt||input.prompt);
    return {brief,enhancedPrompt:detailedPrompt(input,brief,raw),model};
   }catch{lastError=`${model}: resposta não foi um briefing JSON válido`;if(jsonMode)continue}
  }
 }
 throw new Error(`Não foi possível produzir briefing com a NVIDIA. ${lastError}`);
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin');
 if(origin&&!ALLOWED_ORIGINS.has(origin))return json({error:'Origem não autorizada.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{
  'Access-Control-Allow-Origin':origin||'https://dev-oestagiario.github.io',
  'Access-Control-Allow-Methods':'OPTIONS, GET, POST',
  'Access-Control-Allow-Headers':'authorization, content-type, apikey',
  'Access-Control-Max-Age':'86400','Vary':'Origin'
 }});
 const key=Deno.env.get('NVIDIA_API_KEY')||'';
 const path=new URL(req.url).pathname;
 if(req.method==='GET'&&path.endsWith('/api/health'))
  return json({status:'ok',configured:Boolean(key),auth:'supabase-email'},200,origin);
 if(req.method==='GET'&&path.endsWith('/api/models'))
  return json({configured:Boolean(key),requiresAuth:true,selected:null,catalogAccessible:false},200,origin);
 if(req.method!=='POST'||!(path.endsWith('/api/enhance')||path.endsWith('/api/generate')))
  return json({error:'Rota não encontrada.'},404,origin);
 const action=path.endsWith('/api/enhance')?'enhance':'generate';
 const userId=await authenticatedUser(req);
 if(!userId)return json({error:'Entre com seu e-mail para gerar designs com a NVIDIA.'},401,origin);
 if(!key)return json({error:'NVIDIA_API_KEY não configurada no Supabase.'},503,origin);
 const body=await req.text();
 if(body.length>24000)return json({error:'Solicitação grande demais.'},413,origin);
 let data:unknown;
 try{data=JSON.parse(body)}catch{return json({error:'JSON inválido.'},400,origin)}
 if(!isInput(data))return json({error:'Descrição, estilo ou formato inválido.'},422,origin);
 try{
  const quota=await takeQuota(userId,action);
  if(!quota.allowed)return json({error:quota.reason||'Cota esgotada.'},429,origin);
  const result=await nvidiaBrief(data,key);
  if(action==='enhance')return json({...result,remainingToday:quota.remainingToday},200,origin);
  const source=data.originalPrompt||data.prompt;
  const intent=extractArtIntent(source,data.prompt);
  const design=composeProfessionalDesign(result.brief,data.prompt,data.style,data.format,source);
  const issues=auditProfessionalDesign(design,intent);
  return json({...result,design,modelMode:'automatic',remainingToday:quota.remainingToday,
   qualityReport:{passed:issues.length===0,issues},
   repairs:issues.length?['Direção de arte revisada: '+issues.slice(0,3).join(' | ')]:[]},200,origin);
 }catch(error){
  const message=error instanceof Error?error.message:'Falha da geração.';
  console.error('FrameCraft:',message);
  return json({error:message},/cota|limite/.test(message.toLowerCase())?429:502,origin);
 }
});
