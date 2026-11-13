/**
 * FrameCraft design director.
 * Pure TS with no runtime dependencies so the exact same composition policy
 * can run in the Node preview API and in a Supabase Edge Function.
 * The model writes art direction and concise copy; deterministic geometry
 * safeguards typography, layout and legibility.
 */
export type PosterStyle = 'studio'|'bold'|'editorial'|'minimal'|'playful';
export type PosterFormat = 'portrait'|'square'|'story'|'landscape'|'banner';
export type PosterBrief = {
  headline:string; subheadline?:string; callToAction?:string; concept?:string;
  palette?:string[]; visualDirection?:string; imagePrompt?:string;
};
export type PosterElement = {
  id:string;type:string;x:number;y:number;width:number;height:number;
  rotation:number;opacity:number;[key:string]:unknown;
};
export type PosterDesign = {
  version:1;title:string;description:string;
  canvas:{width:number;height:number;background:string;backgroundEnd?:string};
  elements:PosterElement[];
};
const presets:Record<PosterFormat,[number,number]>={
 portrait:[1080,1350],square:[1080,1080],story:[1080,1920],landscape:[1920,1080],banner:[1200,630]
};
const HEX=/^#[\da-fA-F]{6}$/;
export function luminance(hex:string):number {
  if(!HEX.test(hex))return 0;
  const rgb=[1,3,5].map(p=>parseInt(hex.slice(p,p+2),16)/255).map(c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4));
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
export function contrast(a:string,b:string):number {
 const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function truncateWord(text:string,limit:number):string {
 const clean=text.replace(/\s+/g,' ').trim();if(clean.length<=limit)return clean;
 const s=clean.slice(0,limit+1);const at=s.lastIndexOf(' ');
 return (at>Math.round(limit*.65)?s.slice(0,at):s.slice(0,limit)).trim();
}
function chooseAccent(palette:string[]|undefined,dark:boolean):string {
 const safe=dark?'#68EAC0':'#136D5A';
 const candidates=(palette??[]).filter(x=>HEX.test(x));
 const background=dark?'#0B1C24':'#F4F7F2';
 return candidates.find(x=>contrast(x,background)>=4 && luminance(x)>.09 && luminance(x)<.85)||safe;
}
function visibleColor(background:string,preferDark:boolean):string{
 return contrast(background,preferDark?'#102E32':'#F8FEFA')>=4.5?(preferDark?'#102E32':'#F8FEFA'):(preferDark?'#F8FEFA':'#102E32');
}
function pickHeadline(brief:PosterBrief,prompt:string):string {
 return String(brief.headline||truncateWord(prompt,64)||'Uma ideia em destaque').trim().slice(0,140);
}
function mainFont(title:string,width:number,height:number,initial:number,min:number):number {
 let size=initial;
 while(size>min){
  const rows=title.split('\n').reduce((sum,line)=>sum+Math.max(1,Math.ceil(line.length/Math.max(1,Math.floor(width/(size*.54))))),0);
  if(rows*size*1.2<=height)break;
  size-=2;
 }
 return Math.max(min,size);
}
export function composeProfessionalDesign(brief:PosterBrief,prompt:string,style:PosterStyle,format:PosterFormat):PosterDesign {
 const [w,h]=presets[format];
 const horizontal=format==='landscape'||format==='banner';
 const dark=!(style==='editorial'||style==='minimal');
 const bg=dark?'#0B1C24':'#F4F7F2',bgEnd=dark?'#143841':'#E8F0E9';
 const ink=dark?'#F8FFF9':'#113434',muted=dark?'#B9D7D2':'#456660';
 const accent=chooseAccent(brief.palette,dark);
 const light=dark?'#DDFCF0':'#FFFFFF';
 const accentText=visibleColor(accent,true);
 const title=pickHeadline(brief,prompt);
 const deck=truncateWord(brief.subheadline||brief.concept||'Uma composição visual feita para comunicar com clareza.',165);
 const cta=truncateWord(brief.callToAction||'Conheça mais',format==='banner'?18:38);
 const elements:PosterElement[]=[];
 let idx=0;
 const add=(type:string,x:number,y:number,width:number,height:number,rest:Record<string,unknown>={})=>{
   const round=(n:number)=>Math.round(n);
   elements.push({id:`fc-${++idx}-${type}`,type,x:round(x),y:round(y),width:round(width),height:round(height),rotation:0,opacity:1,...rest});
 };
 const rect=(x:number,y:number,width:number,height:number,fill:string,radius=0,extras:Record<string,unknown>={})=>add('rect',x,y,width,height,{fill,radius,strokeWidth:0,...extras});
 const ellipse=(x:number,y:number,width:number,height:number,fill:string,extras:Record<string,unknown>={})=>add('ellipse',x,y,width,height,{fill,...extras});
 const polygon=(x:number,y:number,width:number,height:number,fill:string,sides=4,extras:Record<string,unknown>={})=>add('polygon',x,y,width,height,{fill,sides,...extras});
 const line=(x:number,y:number,width:number,height:number,color:string,strokeWidth=3,extras:Record<string,unknown>={})=>add('line',x,y,Math.max(1,width),Math.max(1,height),{fill:color,strokeWidth,...extras});
 const star=(x:number,y:number,width:number,height:number,fill:string,points=5,extras:Record<string,unknown>={})=>add('star',x,y,width,height,{fill,points,innerRatio:.46,...extras});
 const text=(content:string,x:number,y:number,width:number,height:number,fontSize:number,color=ink,fontWeight:'normal'|'bold'='normal',fontFamily:'Inter'|'Georgia'='Inter',align:'left'|'center'|'right'='left')=>{
   add('text',x,y,width,height,{content,fontSize,fontWeight,fontFamily,align,color});
 };
 // Ambient shapes give visual character and purposeful visual weight, without fake UI metrics.
 const side=w*.075;
 const border=dark?'#42655D':'#B4CFC4';
 if(horizontal){
   line(side,h*.115,w*.115,1,accent,5);
   const headWidth=w*(format==='banner'?.57:.55), headY=h*(format==='banner'?.16:.19), headHeight=h*(format==='banner'?.40:.32);
   const titleSize=mainFont(title,headWidth,headHeight,style==='bold'?Math.min(112,h*.14):Math.min(100,h*.125),format==='banner'?64:52);
   text(title,side,headY,headWidth,headHeight,titleSize,ink,'bold',style==='editorial'?'Georgia':'Inter');
   const deckY=h*.57;
   text(deck,side,deckY,w*.51,h*.155,Math.round(Math.min(43,h*.058)),muted,'normal');
   // Focused decorative mark inhabits the entire right side; it is deliberately non-UI.
   rect(w*.655,h*.13,w*.285,h*.71,dark?'#19443E':'#D2E8D9',26,{fillEnd:dark?'#28685C':'#B1DCC5',rotation:-5});
   ellipse(w*.69,h*.175,w*.24,h*.44,accent,{opacity:.92});
   polygon(w*.76,h*.28,w*.17,h*.29,bg,4,{rotation:22});
   line(w*.69,h*.68,w*.22,1,light,5,{opacity:.8});
   star(w*.877,h*.63,w*.06,h*.105,light,5);
   // CTA and baseline are aligned with headline, never floating mid canvas.
   rect(side,h*.82,w*.285,h*.11,accent,14);
   text(cta,side+w*.028,h*.84,w*.232,h*.07,Math.round(Math.min(38,h*.045)),accentText,'bold');
 }else{
   // Title occupies a generous, stable editorial zone.
   const ty=h*.10, th=h*(format==='story'?.235:.245);
   const titleSize=mainFont(title,w*.855,th,style==='bold'?114:106,56);
   text(title,side,ty,w*.855,th,titleSize,ink,'bold',style==='editorial'?'Georgia':'Inter');
   line(side,h*.375,w*.14,1,accent,6);
   text(deck,side,h*.394,w*.82,h*(format==='story'?.115:.095),format==='story'?44:43,muted,'normal');
   // A large authored geometric artwork, not a fake dashboard or tiny nested cards.
   const y=h*.52, heroH=h*(format==='story'?.285:.272);
   rect(side,y,w*.85,heroH,dark?'#1B4641':'#DFEBE2',32,{fillEnd:dark?'#1B3A4A':'#CCE5D7'});
   // Main visual focal point: layered cutout, orbital curve and angled motif.
   ellipse(w*.38,y+heroH*.085,w*.46,heroH*.83,accent);
   polygon(w*.51,y+heroH*.2,w*.27,heroH*.56,bg,4,{rotation:20});
   ellipse(w*.16,y+heroH*.29,w*.17,heroH*.51,dark?'#36766E':'#9ECBB5',{opacity:.85});
   polygon(w*.19,y+heroH*.16,w*.12,heroH*.27,light,3,{rotation:-15,opacity:.94});
   line(w*.20,y+heroH*.79,w*.60,1,light,7,{opacity:.78});
   star(w*.74,y+heroH*.14,w*.10,heroH*.23,light,5,{opacity:.95});
   // Stable anchored action region, no orphaned bottom 25% blank.
   line(side,h*.823,w*.85,1,border,2);
   rect(side,h*.858,w*.545,h*.071,accent,17);
   text(cta,side+w*.035,h*.871,w*.465,h*.046,36,accentText,'bold');
   line(side,h*.956,w*.18,1,accent,4);
 }
 // No brand watermarks, invented metrics, free claims or tiny filler text.
 return {version:1,title:truncateWord(title,90),description:truncateWord(brief.visualDirection||brief.concept||'',450),
  canvas:{width:w,height:h,background:bg,backgroundEnd:bgEnd},elements};
}
export function auditProfessionalDesign(design:PosterDesign):string[] {
 const issues:string[]=[];
 const w=design.canvas.width,h=design.canvas.height;
 const textElements=design.elements.filter(e=>e.type==='text');
 const decor=design.elements.filter(e=>e.type!=='text');
 if(!textElements.some(e=>Number(e.fontSize)>=Math.min(65,w*.052)))issues.push('Título principal sem escala tipográfica de destaque.');
 for(const e of textElements){
   const content=String(e.content||'').trim();
   const fs=Number(e.fontSize);
   if(!content)issues.push('Camada de texto vazia.');
   if(fs<28)issues.push(`Tipografia muito pequena: ${fs}px.`);
   const rows=content.split('\n').reduce((total,row)=>total+Math.max(1,Math.ceil(row.length/Math.max(1,Math.floor(e.width/(fs*.53))))),0);
   if(rows*fs*1.14>e.height*1.22)issues.push(`Texto pode exceder a caixa: "${content.slice(0,32)}".`);
 }
 for(let i=0;i<textElements.length;i++)for(let j=i+1;j<textElements.length;j++){
   const a=textElements[i],b=textElements[j];
   const intersection=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
   if(intersection>Math.min(a.width*a.height,b.width*b.height)*.08)issues.push('Há caixas de texto com interseção.');
 }
 for(const e of design.elements){
   if(e.x<-2||e.y<-2||e.x+e.width>w+2||e.y+e.height>h+2)issues.push(`Elemento fora do canvas: ${e.id}.`);
 }
 if(decor.length<3)issues.push('Falta um ponto focal gráfico com elementos visuais.');
 if(Math.max(...design.elements.map(e=>e.y+e.height),0)<h*.81)issues.push('O terço inferior está excessivamente vazio.');
 return [...new Set(issues)].slice(0,10);
}
