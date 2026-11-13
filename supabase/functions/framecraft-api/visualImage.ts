/**
 * NVIDIA visual-model integration. A language model cannot generate image
 * pixels: this module calls the dedicated FLUX.1-schnell text-to-image NIM.
 * Preview availability and NVIDIA trial terms are account-specific.
 */
import {extractArtIntent} from './subjectFidelity.ts';

type VisualInput={
 prompt:string;
 originalPrompt?:string;
 format:'portrait'|'square'|'story'|'landscape'|'banner';
 style:'studio'|'bold'|'editorial'|'minimal'|'playful';
};
type VisualBrief={
 headline:string;subheadline?:string;concept?:string;visualDirection?:string;
 imagePrompt?:string;palette?:string[];heroElement?:string;
};
const ENDPOINT='https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell';
export const VISUAL_MODEL='black-forest-labs/flux.1-schnell';
const MODEL_IMAGE_LIMIT=4_700_000;
const max=(text:string,count:number)=>text.trim().slice(0,count);
export function buildVisualPrompt(input:VisualInput,brief:VisualBrief):string{
 const source=input.originalPrompt||input.prompt;
 const intent=extractArtIntent(source,input.prompt);
 const food=/\b(hamb[úu]rguer|burger|pizza|lanche|gastronomia|comida|prato|restaurante|sobremesa|sorvete|café)\b/i.test(source);
 const noPhotography=/\b(sem fotos?|nenhuma fotografia|não usar fotografias?|render 3d|3d estilizado|ilustra[çc][ãa]o)\b/i.test(source);
 const subject=food
   ? /hamb[úu]rguer|burger/i.test(source)?'a beautifully presented premium gourmet HAMBURGER with recognizable golden bun, melted cheese, grilled patty, fresh vegetables and sauce'
     :'the food dish named in the original user brief, recognizable, beautifully prepared'
   :intent.brand||intent.subject!=='Assunto descrito pelo usuário'?intent.subject:brief.heroElement||'the explicitly requested product';
 const medium=noPhotography
   ?'Highly detailed high-end 3D product illustration, premium CGI, tactile materials, directional studio lighting, convincing form and depth. No stock photo.'
   :food
     ?'High-end commercial food photography, delicious natural food textures, appetizing sheen, cinematic studio lights, professional restaurant advertising, realistic optics.'
     :'High-end commercial advertising visual, detailed subject, cinematic studio lighting, premium editorial polish, realistic material details and depth.';
 const mood=input.style==='minimal'?'restrained minimal backdrop, sophisticated negative space':
   input.style==='bold'?'dramatic high-contrast campaign lighting, energetic composition':
   input.style==='editorial'?'luxury magazine art direction with refined color grading':
   'premium sophisticated advertising art direction';
 const prompt=[
  'Create the IMAGE/HERO of a premium advertising poster, WITHOUT any typography.',
  'PRIMARY SUBJECT: '+subject+'. The subject must be instantly recognizable and occupy the main middle of the image.',
  medium,mood,
  'Original intent (never erase main product): '+max(source,1100),
  'Visual direction: '+max(brief.visualDirection||brief.concept||'',500),
  'Hero treatment: '+max(brief.heroElement||brief.imagePrompt||'',450),
  'Palette (subtle harmonization): '+(brief.palette||[]).filter(x=>/^#[a-fA-F0-9]{6}$/.test(x)).slice(0,5).join(', '),
  'COMPOSITION: leave calm dark negative space towards the upper edge for editable typography and towards the bottom edge for a CTA. Strong hero with clear silhouette and elegant lighting.',
  'No text, no letters, no labels, no captions, no fake sale badges, no interface elements, no watermarks. Do not invent logos.',
  'One coherent frame with no collage, no random squares, no empty geometric placeholders. Ad quality, richly textured, professionally art-directed.'
 ].join('\n');
 return prompt.slice(0,7800);
}
export async function generateNvidiaHero(
 input:VisualInput,brief:VisualBrief,apiKey:string
):Promise<{src:string;model:string;description:string}>{
 const prompt=buildVisualPrompt(input,brief);
 let res:Response;
 try{
  res=await fetch(ENDPOINT,{
   method:'POST',
   headers:{Authorization:'Bearer '+apiKey,Accept:'application/json','Content-Type':'application/json'},
   body:JSON.stringify({prompt,mode:'base',samples:1,seed:0,steps:4,cfg_scale:0,width:1024,height:1024,image:null}),
   signal:AbortSignal.timeout(95_000)
  });
 }catch{
  throw new Error('A conexão com o modelo visual NVIDIA falhou. Confira a disponibilidade do FLUX.1 Schnell na sua conta.');
 }
 if(res.status===401||res.status===403)throw new Error('A chave NVIDIA não tem acesso ao modelo de imagem FLUX.1 Schnell. Verifique permissões e condições do NVIDIA Build.');
 if(res.status===429)throw new Error('Cota de imagens NVIDIA esgotada. Tente novamente quando houver disponibilidade.');
 if(!res.ok)throw new Error('Modelo visual NVIDIA indisponível (HTTP '+res.status+'). Você pode importar uma foto e usar o modo híbrido.');
 let payload:unknown;
 try{payload=await res.json()}catch{throw new Error('O serviço NVIDIA retornou uma resposta de imagem inválida.')}
 const artifact=(payload as {artifacts?:Array<{base64?:unknown}>})?.artifacts?.[0]?.base64;
 if(typeof artifact!=='string'||!artifact.trim())throw new Error('O modelo visual não retornou uma imagem. Verifique se o endpoint permite inferência na sua conta.');
 const clean=artifact.replace(/^data:image\/(?:jpeg|png|webp);base64,/i,'').replace(/\s/g,'');
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(clean)||clean.length>MODEL_IMAGE_LIMIT||clean.length<1000)
  throw new Error('Imagem do modelo inválida ou maior que o limite permitido pelo editor (aprox. 3,5 MB).');
 const mime=clean.startsWith('iVBORw0KGgo')?'image/png':clean.startsWith('UklGR')?'image/webp':'image/jpeg';
 return {src:`data:${mime};base64,${clean}`,model:VISUAL_MODEL,description:'Hero de campanha gerado pelo modelo visual NVIDIA FLUX.1 Schnell'};
}
