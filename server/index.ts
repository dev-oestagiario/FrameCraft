import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import { NvidiaRouter, NvidiaError } from './nvidia';
import { buildDesignGuidance } from './designSkills';
import { designSchema, formats, generateRequestSchema, type CreativeBrief, type Design } from '../src/lib/schema';
import { repairAiBrief, repairAiDesign } from './aiRepair';
import { auditProfessionalDesign, composeProfessionalDesign } from '../src/lib/proComposer';
import { extractArtIntent, enforceSubjectFidelity } from '../src/lib/subjectFidelity';

dotenv.config();
const app = express();
const port = Number(process.env.PORT ?? 8787);
const nvidia = new NvidiaRouter();
app.disable('x-powered-by');
app.use(cors({origin: process.env.ALLOWED_ORIGIN?.split(',').map(x=>x.trim()) ?? ['http://localhost:5173','http://127.0.0.1:5173']}));
app.use(express.json({ limit:'1mb' }));
app.get('/api/health',(_req,res)=>res.json({status:'ok',configured:nvidia.configured, ...nvidia.diagnostics()}));
app.get('/api/models',async(_req,res)=>res.json({configured:nvidia.configured,...await nvidia.discover()}));

export function parseJSON(raw: string): unknown {
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi,'').trim();
  try {return JSON.parse(cleaned)} catch { /* attempt fenced JSON */ }
  const fenced=cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if(fenced) {try{return JSON.parse(fenced[1].trim())}catch{/* attempt embedded JSON */}}
  const first=cleaned.indexOf('{'),last=cleaned.lastIndexOf('}');
  if(first>=0 && last>first) return JSON.parse(cleaned.slice(first,last+1));
  throw new Error('O modelo não retornou um objeto JSON válido.');
}

async function chat(system: string, user: string, maxTokens = 4000): Promise<{content:string;model:string}> {
  return nvidia.chat(system,user,maxTokens);
}

const directionSystem=`REGRA INEGOCIÁVEL: marcas, produtos e sujeitos especificados pelo usuário não podem ser removidos. PS5 deve aparecer como PS5 ou PlayStation 5, e o elemento hero deve estar relacionado ao console; 'geometria genérica' não basta. Priorize composições com identidade própria e texturas vetoriais em camadas. Você é um diretor de arte sênior especializado em publicidade, peças editoriais, capas e infográficos. Transforme qualquer pedido vago numa direção de arte viável e clara. Preserve textos, nomes, marcas, datas e números que o usuário especificar. Não invente métricas, depoimentos ou preços. Escreva em português do Brasil. Responda EXCLUSIVAMENTE com JSON válido, SEM markdown, com estes campos exatos: {"concept":"...","audience":"...","headline":"...","subheadline":"...","visualDirection":"...","typography":"...","palette":["#RRGGBB","#RRGGBB","#RRGGBB"],"hierarchy":"...","imagePrompt":"...","callToAction":"..."}. Use pelo menos dois hexadecimais válidos. O campo imagePrompt descreve um possível asset externo, não prometa que um modelo de imagens será executado. O headline deve ter idealmente 28 a 55 caracteres e descrever um benefício real com precisão; o subheadline deve ser curto (até 110 caracteres); um CTA só deve fazer afirmações verificáveis. NUNCA invente 'grátis', descontos, dados ou resultados. Não insira listas longas nem transcreva o pedido inteiro como manchete. Planeje uma peça comercial premium, que funcione como miniatura no Instagram. Recomende hierarquia, contraste >=4.5:1 para texto pequeno, equilíbrio, grandes formas autorais e margens regulares.`;

const designSystem=`Você é um engenheiro de design editorial e especialista em composição tipográfica. Retorne APENAS JSON válido, sem markdown, sem comentários, usando EXATAMENTE o formato:
{"version":1,"title":"nome","description":"resumo","canvas":{"width":1080,"height":1350,"background":"#0B1621","backgroundEnd":"#123A42"},"elements":[{"id":"unique-id","type":"rect","x":40,"y":40,"width":250,"height":90,"fill":"#234455","radius":16,"rotation":0,"opacity":1,"strokeWidth":0},{"id":"unique-id-2","type":"text","x":60,"y":55,"width":200,"height":65,"content":"Título","fontSize":36,"fontWeight":"bold","color":"#FFFFFF","align":"left","fontFamily":"Inter","rotation":0,"opacity":1}]}.
Tipos permitidos: text, rect, ellipse, polygon (sides:3..12), star (points:4..12,innerRatio:0.1..0.85) e line (fill:#RRGGBB,strokeWidth:1..30). Para rect e ellipse use fillEnd opcional para gradiente. Preserve exatamente nomes próprios e mensagens obrigatórias. NÃO use tipo image: imagens só podem ser inseridas pelo editor com upload. Use cores #RRGGBB exatas. Para texto, fontWeight normal|bold, fontFamily Inter|Arial|Georgia|Verdana, align left|center|right. Não use Montserrat, Poppins, Roboto, sans-serif, serif ou cores CSS como rgba(), nomes ou #RGB: transforme em #RRGGBB. Para rect inclua fill e radius (0-300), strokeWidth:0. Para ellipse inclua fill. Todos exigem id único, x,y,width,height,opacity:1,rotation:0. O layout deve ser sofisticado, sem cara de template genérico: contraste, hierarquia tipográfica marcante, camadas equilibradas, formas abstratas, cartões e CTAs quando relevantes. Use 9 a 20 elementos bem organizados. Manchetão de pelo menos 72px em post vertical de 1080px, textos menores a partir de 32px. Proibido inserir cards minúsculos com textos de 12px, áreas vazias maiores que 20% no rodapé, cores de pouco contraste ou cabeçalhos brancos sobre fundos muito claros. O texto deve caber dentro de largura e altura: linhas curtas, títulos legíveis, áreas separadas; não sobreponha elementos de texto. Crie uma arte final de alta qualidade. Sem caracteres emoji obrigatórios. Evite usar uma infinidade de cartões pequenos. O usuário quer um poster bonito, não um mockup de dashboard a menos que solicitado. Não adicione texto comercial falso. Sempre respeite dimensões do canvas e margens de pelo menos 40px. Responda só JSON.`;

async function makeBrief(input:z.infer<typeof generateRequestSchema>):Promise<CreativeBrief>{
  const intent=extractArtIntent(input.originalPrompt||input.prompt,input.prompt);
  const message=`DESCRIÇÃO ORIGINAL PRESERVADA: ${input.originalPrompt||input.prompt}\nENTIDADE OBRIGATÓRIA: ${intent.brand||intent.subject}\nNÃO substitua o produto por abstração genérica.\nDESCRIÇÃO EDITADA: ${input.prompt}\nESTILO: ${input.style}\nFORMATO: ${formats[input.format].label}\n${input.enhancedPrompt?`DIREÇÃO DE ARTE DETALHADA REVISADA: ${input.enhancedPrompt}`:''}\n${input.instruction?`REVISÃO DESEJADA: ${input.instruction}`:''}\nCrie briefing aprofundado, estratégico e visualmente específico. Não introduza alegações inexistentes.\n${buildDesignGuidance(input.style,input.format)}`;
  let result=await chat(directionSystem,message,2300);
  let raw=result.content;
  try{const brief=repairAiBrief(parseJSON(raw));return {...brief,visualDirection:enforceSubjectFidelity(input.prompt,brief.visualDirection,input.originalPrompt||input.prompt)}}catch{
    result=await chat(directionSystem+' ATENÇÃO: todos os campos são obrigatórios e o resultado deve ser JSON parseável.',message,2300);
    raw=result.content;
    const brief=repairAiBrief(parseJSON(raw));return {...brief,visualDirection:enforceSubjectFidelity(input.prompt,brief.visualDirection,input.originalPrompt||input.prompt)};
  }
}
async function makeDesign(input:z.infer<typeof generateRequestSchema>, brief:CreativeBrief):Promise<{design:Design;repairs:string[]}>{
  const intent=extractArtIntent(input.originalPrompt||input.prompt,input.prompt);
  const size=formats[input.format];
  const message=`CANVAS OBRIGATÓRIO: ${size.width}x${size.height} px.\nDIREÇÃO CRIATIVA: ${JSON.stringify(brief)}\nPEDIDO ORIGINAL: ${input.prompt}\nESTILO: ${input.style}\n${input.previous?`DESIGN ANTERIOR, que pode ser modificado: ${JSON.stringify({...input.previous,elements:input.previous.elements.filter(e=>e.type!=='image')})}`:''}\n${input.instruction?`AJUSTE SOLICITADO: ${input.instruction}`:''}\nGere o JSON final de desenho, com aspecto de arte profissional. Inclua todo texto essencial do pedido.\n${buildDesignGuidance(input.style,input.format)}`;
  let reason='';
  try{
    let result=await chat(designSystem,message,6000);
    for(let retry=0;retry<2;retry++){
      try{
        const candidate=repairAiDesign(parseJSON(result.content),size,brief.palette);
        const issues=auditProfessionalDesign(candidate.design,intent);
        if(intent.renderIntent==='professional-ad'&&candidate.design.elements.filter(e=>e.type==='path').length===0)issues.push('Campanha sem linguagem hero identificável; não usar template genérico.');
        if(!issues.length)return candidate;
        reason=issues.slice(0,3).join(' | ');
        break; // Don't burn more NVIDIA credits on a geometrically poor composition.
      }catch(e){
        reason=e instanceof Error?e.message:'JSON inválido';
        if(retry===0)result=await chat(designSystem,`${message}\nA última versão falhou na validação. Corrija o JSON: ${reason.slice(0,450)}`,6000);
      }
    }
  }catch(e){reason=e instanceof Error?e.message:'Falha na etapa de layout';}
  // Quality gate: do not show illegible amateur layouts. The detailed creative
  // brief still comes from NVIDIA, but the geometry becomes deterministic.
  const composed=composeProfessionalDesign(brief,input.prompt,input.style,input.format,input.originalPrompt||input.prompt);
  const validated=designSchema.parse(composed);
  const residual=auditProfessionalDesign(validated,intent);
  if(residual.length)console.warn('[design quality] revisão recomendada:',residual.join(' | '));
  return {design:validated,repairs:[`Layout reorganizado pela direção de arte profissional: ${reason.slice(0,180)||'melhoria de legibilidade e hierarquia visual'}.`]};
}
function expandLocalPrompt(input:z.infer<typeof generateRequestSchema>,brief:CreativeBrief):string{
 return [
  'DIREÇÃO DE ARTE PROFISSIONAL — FRAMECRAFT',
  'CONTEÚDO SOLICITADO: '+(input.originalPrompt||input.prompt),
  'ASSUNTO/MARCA OBRIGATÓRIOS: '+extractArtIntent(input.originalPrompt||input.prompt,input.prompt).brand,
  'OBJETIVO E CONCEITO: '+brief.concept+'. Evitar dados, preços, características e promessas não informadas pelo usuário.',
  'PÚBLICO: '+brief.audience+'. Adequar voz e nível de formalidade à mensagem.',
  'FORMATO: '+formats[input.format].width+' × '+formats[input.format].height+' pixels; estilo visual '+input.style+'. Manter margens seguras de pelo menos 7%.',
  'CONTEÚDO EDITORIAL: manchete '+JSON.stringify(brief.headline)+'; texto auxiliar '+JSON.stringify(brief.subheadline||'omitir quando não houver')+'; chamada para ação '+JSON.stringify(brief.callToAction)+'.',
  'COMPOSIÇÃO E RITMO: '+brief.visualDirection+'. Foco gráfico autoral, sem painéis simulados e cartões repetitivos.',
  'HIERARQUIA E POSICIONAMENTO: '+brief.hierarchy+'. Título no topo com grande escala, apoio legível e CTA no terço inferior.',
  'TIPOGRAFIA: '+brief.typography+'. Até duas famílias, headline dominante e texto auxiliar confortável em telas pequenas.',
  'PALETA E ACESSIBILIDADE: '+brief.palette.join(', ')+'. Preservar contraste alto, consistência e legibilidade em miniatura.',
  'ELEMENTOS E TÉCNICA: composição vetorial profissional com retângulos, elipses, linhas, polígonos, estrelas e gradientes discretos.',
  'CONTROLE DE QUALIDADE: sem microtextos, cortes, sobreposição, margem irregular, CTAs deslocados, informação inventada ou excesso de espaço vazio.',
  'SAÍDA: JSON estruturado com dimensões exatas, formas editáveis e tipografia hierarquizada.'
 ].join('\n\n');
}
app.post('/api/enhance',async(req,res)=>{
 try{
  const input=generateRequestSchema.parse(req.body);
  const brief=await makeBrief(input);
  res.json({brief,enhancedPrompt:enforceSubjectFidelity(input.prompt,expandLocalPrompt(input,brief),input.originalPrompt||input.prompt),model:nvidia.selected});
 }catch(error){
  if(error instanceof z.ZodError){res.status(422).json({error:'Dados inválidos',details:error.issues});return}
  const err=error as Error & {status?:number};
  res.status(err.status===429?429:502).json({error:err.message||'Falha ao aprimorar prompt.'});
 }
});

const requestTracker=new Map<string,number[]>();
app.post('/api/generate',async(req,res)=>{
  try{
    const ip=req.ip || 'local'; const now=Date.now();
    const hits=(requestTracker.get(ip)||[]).filter(t=>now-t<60_000);
    if(hits.length>=6){res.status(429).json({error:'Limite local: máximo 6 gerações por minuto. Tente novamente em instantes.'});return}
    hits.push(now);requestTracker.set(ip,hits);
    const input=generateRequestSchema.parse(req.body);
    const brief=await makeBrief(input);
    const {design,repairs}=await makeDesign(input,brief);
    if(repairs.length)console.info('[generate] JSON NVIDIA normalizado:',repairs.join(' | '));
    res.json({brief,design,repairs,model:nvidia.selected,modelMode:nvidia.diagnostics().mode});
  }catch(error){
    if(error instanceof z.ZodError){res.status(422).json({error:'Dados inválidos',details:error.issues});return}
    const err=error as Error & {status?:number};
    const status=err instanceof NvidiaError ? (err.status === 401 ? 401 : err.status === 429 ? 429 : err.status === 503 ? 503 : 502) : 502;
    console.error('[generate]',err.message);
    res.status(status).json({error:err.name==='AbortError'?'A NVIDIA excedeu o tempo limite. Tente novamente.':err.message||'Erro inesperado na geração.'});
  }
});
app.use((_,res)=>res.status(404).json({error:'Rota não encontrada'}));
app.listen(port,()=>console.log(`[AI Image Studio] API em http://localhost:${port} | Modelo: seleção automática | NVIDIA: ${nvidia.configured?'configurada':'não configurada'}`));
