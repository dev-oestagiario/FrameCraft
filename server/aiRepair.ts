/**
 * Best-effort adapter for imperfect LLM output. The strict Zod schema remains
 * the canonical contract for saved files and client state. Only generated
 * content passes through this adapter, then through strict Zod validation.
 */
import { designSchema, briefSchema, normalizeDesign, type CreativeBrief, type Design } from '../src/lib/schema';

type Dict = Record<string, unknown>;
const asObject = (value: unknown): Dict => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Dict : {};
const string = (value: unknown, fallback = ''): string => typeof value === 'string' ? value : typeof value === 'number' ? String(value) : fallback;
const clamp = (value: unknown, fallback: number, low: number, high: number): number => {
  const n = typeof value === 'string' ? Number(value.trim().replace(/px$/i, '').replace(/%$/, '')) : value;
  return Math.max(low, Math.min(high, typeof n === 'number' && Number.isFinite(n) ? n : fallback));
};
const namedColors: Record<string,string> = {
  black:'#000000',white:'#FFFFFF',red:'#FF0000',green:'#008000',blue:'#0000FF',yellow:'#FFFF00',
  purple:'#800080',orange:'#FFA500',pink:'#FFC0CB',gray:'#808080',grey:'#808080',
  silver:'#C0C0C0',navy:'#000080',teal:'#008080',cyan:'#00FFFF',aqua:'#00FFFF',
  lime:'#00FF00',gold:'#FFD700',coral:'#FF7F50',magenta:'#FF00FF',indigo:'#4B0082',
  violet:'#EE82EE',beige:'#F5F5DC',brown:'#A52A2A',maroon:'#800000',
  transparent:'#000000',currentcolor:'#FFFFFF',
};
const colorHex = (n: number): string => Math.round(Math.min(255,Math.max(0,n))).toString(16).padStart(2,'0').toUpperCase();
const expandHex = (value: string): string | null => {
  const raw=value.toUpperCase();
  if(/^#[0-9A-F]{6}$/.test(raw))return raw;
  if(/^#[0-9A-F]{8}$/.test(raw))return raw.slice(0,7);
  if(/^#[0-9A-F]{3,4}$/.test(raw))return '#'+raw.slice(1,4).split('').map(c=>c+c).join('');
  return null;
};
function rgbComponent(raw:string):number {
  const token=raw.trim();return token.endsWith('%') ? clamp(parseFloat(token)*2.55,0,0,255) : clamp(token,0,0,255);
}
function rgbToHex(text:string):string|null {
  const m=text.match(/rgba?\(\s*([^)]*)\s*\)/i);
  if(!m)return null;
  const channels=m[1].replace(/\s*\/\s*/g,',').split(/[\s,]+/).filter(Boolean).slice(0,3);
  if(channels.length!==3 || channels.some(c=>!/^[-+]?\d+(?:\.\d+)?%?$/.test(c)))return null;
  return '#'+channels.map(v=>colorHex(rgbComponent(v))).join('');
}
function hslToHex(text:string):string|null {
  const match=text.match(/hsla?\(\s*([^)]*)\s*\)/i);
  if(!match)return null;
  const tokens=match[1].replace(/\s*\/\s*/g,',').split(/[\s,]+/).filter(Boolean);
  if(tokens.length<3 || !tokens[1].endsWith('%') || !tokens[2].endsWith('%'))return null;
  const h=((Number(tokens[0].replace('deg',''))%360)+360)%360;
  const s=clamp(tokens[1].replace('%',''),0,0,100)/100;
  const l=clamp(tokens[2].replace('%',''),0,0,100)/100;
  if(!Number.isFinite(h))return null;
  const a=s*Math.min(l,1-l);
  const channel=(n:number)=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1))};
  return '#'+[channel(0),channel(8),channel(4)].map(v=>colorHex(v*255)).join('');
}
/** Accept common CSS formats while producing only #RRGGBB. Never returns raw CSS. */
export function normalizeAiColor(value:unknown, fallback='#FFFFFF'):string {
  const safeFallback=expandHex(fallback)||'#FFFFFF';
  if(typeof value!=='string')return safeFallback;
  const raw=value.trim();
  const direct=expandHex(raw);
  if(direct)return direct;
  if(namedColors[raw.toLowerCase()])return namedColors[raw.toLowerCase()];
  if(/^0x[\da-f]{6}$/i.test(raw))return '#'+raw.slice(2).toUpperCase();
  const rgb=rgbToHex(raw);if(rgb)return rgb;
  const hsl=hslToHex(raw);if(hsl)return hsl;
  // For linear-gradient(...) or strings with color annotations, retain first stop.
  const hash=raw.match(/#[a-f0-9]{8}(?![a-f0-9])|#[a-f0-9]{6}(?![a-f0-9])|#[a-f0-9]{4}(?![a-f0-9])|#[a-f0-9]{3}(?![a-f0-9])/i);
  if(hash)return expandHex(hash[0]) || safeFallback;
  const keyword=raw.match(/\b(white|black|navy|teal|cyan|blue|red|orange|purple|pink|gray|grey|yellow|gold|green)\b/i);
  return keyword ? namedColors[keyword[0].toLowerCase()] : safeFallback;
}
export function normalizeAiFont(value:unknown):'Inter'|'Arial'|'Georgia'|'Verdana' {
  const name=string(value).trim().toLowerCase();
  if(/(georgia|times|serif)/.test(name) && !/sans-serif/.test(name))return 'Georgia';
  if(/verdana|tahoma/.test(name))return 'Verdana';
  if(/arial|helvetica|roboto|sans-serif/.test(name))return 'Arial';
  return 'Inter'; // Poppins, Montserrat, Manrope, custom family etc.
}
function normalizeWeight(value:unknown):'normal'|'bold' {
  if(typeof value==='number')return value>=600?'bold':'normal';
  const s=string(value).toLowerCase();
  if(/^(bold|bolder|semibold|semi-bold|extrabold|heavy|black)$/.test(s))return 'bold';
  const n=Number(s);return Number.isFinite(n)&&n>=600?'bold':'normal';
}
function alignText(value:unknown):'left'|'center'|'right' {
  const s=string(value).toLowerCase();
  return s==='center'||s==='middle'?'center':s==='right'||s==='end'?'right':'left';
}
function colorAlpha(value:unknown):number|null {
  if(typeof value!=='string')return null;
  const raw=value.trim();
  if(raw.toLowerCase()==='transparent')return 0;
  const hex=raw.match(/^#[a-f\d]{4}(?:[a-f\d]{4})?$/i);
  if(hex)return parseInt(raw.length===5?raw[4]+raw[4]:raw.slice(7,9),16)/255;
  const rgba=raw.match(/^rgba?\(.*[,/]\s*([\d.]+%?)\s*\)$/i);
  if(rgba)return rgba[1].endsWith('%')?clamp(parseFloat(rgba[1])/100,1,0,1):clamp(rgba[1],1,0,1);
  return null;
}

export function repairAiBrief(raw:unknown):CreativeBrief {
  const obj=asObject(raw);
  const palette=(Array.isArray(obj.palette)?obj.palette:[]).slice(0,6)
    .map((c:unknown,i:number)=>normalizeAiColor(c,['#0B1621','#2FCAA5','#FFFFFF'][i%3]));
  while(palette.length<2)palette.push(['#0B1621','#2FCAA5'][palette.length]);
  return briefSchema.parse({...obj,palette});
}

export function repairAiDesign(raw:unknown, size:{width:number;height:number}, palette:unknown[]=[]):{design:Design;repairs:string[]} {
  const obj=asObject(raw);const canvas=asObject(obj.canvas);
  if(!Array.isArray(obj.elements) || obj.elements.length===0)throw new Error('A NVIDIA não retornou elementos de composição.');
  const repairs:string[]=[];
  const bg=normalizeAiColor(canvas.background,palette[0] as string||'#0B1621');
  const foreground=normalizeAiColor(palette[1], '#2FCAA5');
  const elements:unknown[]=[];
  for(const [index,value] of obj.elements.slice(0,48).entries()) {
    const e=asObject(value);
    let type=string(e.type).toLowerCase().trim();
    if(['rectangle','rounded-rectangle','roundedrect','square','box'].includes(type))type='rect';
    if(['circle','oval'].includes(type))type='ellipse';
    if(['triangle','diamond','hexagon','pentagon'].includes(type))type='polygon';
    if(['divider','rule','stroke'].includes(type))type='line';
    if(['label','heading','paragraph'].includes(type))type='text';
    if(!['text','rect','ellipse','polygon','star','line'].includes(type)){
      repairs.push(`Elemento ${index+1}: tipo não suportado (${type||'ausente'}), ignorado.`);continue;
    }
    const originalColor=type==='text'?e.color??e.fill:e.fill??e.color;
    const color=normalizeAiColor(originalColor,type==='text'?'#FFFFFF':foreground);
    if(originalColor!==undefined && color!==originalColor)repairs.push(`Elemento ${index+1}: cor convertida para ${color}.`);
    const width=clamp(e.width??e.w,type==='text'?Math.round(size.width*.6):150,1,6000);
    const height=clamp(e.height??e.h,type==='text'?100:150,1,6000);
    const rawOpacity=clamp(e.opacity,1,0,1);
    const alpha=colorAlpha(originalColor);
    const opacity=alpha===null?rawOpacity:Number((rawOpacity*alpha).toFixed(3));
    const base={
      id:string(e.id,`ai-element-${index+1}`).slice(0,80)||`ai-element-${index+1}`, type,
      x:clamp(e.x,40,-4000,6000),y:clamp(e.y,40,-4000,6000), width,height,
      rotation:clamp(e.rotation,0,-360,360),opacity,
    };
    if(type==='text'){
      const fontFamily=normalizeAiFont(e.fontFamily??e.font);
      if(e.fontFamily!==undefined && e.fontFamily!==fontFamily)repairs.push(`Elemento ${index+1}: fonte ajustada para ${fontFamily}.`);
      elements.push({...base,type,content:string(e.content??e.text,'').slice(0,400),fontSize:clamp(e.fontSize,48,10,260),fontWeight:normalizeWeight(e.fontWeight),align:alignText(e.align??e.textAlign),fontFamily,color});
    } else if(type==='rect') {
      const rawStroke=e.stroke;
      elements.push({...base,type,fill:color,radius:clamp(e.radius??e.cornerRadius,20,0,300),
        ...(e.fillEnd?{fillEnd:normalizeAiColor(e.fillEnd,color)}:{}),
        ...(rawStroke?{stroke:normalizeAiColor(rawStroke,foreground)}:{}),
        strokeWidth:clamp(e.strokeWidth,0,0,30)});
    } else if(type==='ellipse') {
      elements.push({...base,type,fill:color,
        ...(e.fillEnd?{fillEnd:normalizeAiColor(e.fillEnd,color)}:{}),
        ...(e.stroke?{stroke:normalizeAiColor(e.stroke,foreground)}:{}),
        strokeWidth:clamp(e.strokeWidth,0,0,30)});
    } else if(type==='polygon') {
      elements.push({...base,type,fill:color,sides:clamp(e.sides,4,3,12),
        ...(e.stroke?{stroke:normalizeAiColor(e.stroke,foreground)}:{}),
        strokeWidth:clamp(e.strokeWidth,0,0,30)});
    } else if(type==='star') {
      elements.push({...base,type,fill:color,points:clamp(e.points,5,4,12),innerRatio:clamp(e.innerRatio,.46,.1,.85),
        ...(e.stroke?{stroke:normalizeAiColor(e.stroke,foreground)}:{}),
        strokeWidth:clamp(e.strokeWidth,0,0,30)});
    } else {
      elements.push({...base,type,fill:color,strokeWidth:clamp(e.strokeWidth,5,1,30)});
    }
  }
  if(obj.elements.length>48)repairs.push('A composição foi limitada a 48 elementos.');
  if(!elements.length)throw new Error('Nenhum elemento de composição compatível foi retornado pela NVIDIA.');
  const repaired={
    version:1,title:string(obj.title,'Arte gerada').slice(0,90)||'Arte gerada',
    description:string(obj.description,'').slice(0,500),
    canvas:{width:size.width,height:size.height,background:bg,
      ...(canvas.backgroundEnd?{backgroundEnd:normalizeAiColor(canvas.backgroundEnd,bg)}:{})},
    elements,
  };
  const design=normalizeDesign(designSchema.parse(repaired));
  return {design,repairs};
}
