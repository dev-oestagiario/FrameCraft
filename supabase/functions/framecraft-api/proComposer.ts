/**
 * FrameCraft 2.0 — structured scene composer.
 * HyperFrames-inspired: brand tokens remain stable, composition varies by intent.
 * Deterministic JSON: no random coordinates, remote assets, arbitrary HTML or JS.
 */
import {extractArtIntent,subjectPresent,type ArtIntent} from './subjectFidelity';

export type PosterStyle='studio'|'bold'|'editorial'|'minimal'|'playful';
export type PosterFormat='portrait'|'square'|'story'|'landscape'|'banner';
export type PosterBrief={
 headline:string;subheadline?:string;callToAction?:string;concept?:string;audience?:string;
 palette?:string[];visualDirection?:string;imagePrompt?:string;typography?:string;
 subject?:string;brand?:string;mustInclude?:string[];heroElement?:string;
 renderIntent?:'professional-ad'|'simple-post'|'editorial';
};
export type PosterElement={
 id:string;type:string;x:number;y:number;width:number;height:number;
 rotation:number;opacity:number;[key:string]:unknown;
};
export type PosterDesign={
 version:1;title:string;description:string;
 canvas:{width:number;height:number;background:string;backgroundEnd?:string};
 elements:PosterElement[];
};
export const formatPresets:Record<PosterFormat,[number,number]>={
 portrait:[1080,1350],square:[1080,1080],story:[1080,1920],
 landscape:[1920,1080],banner:[1200,630]
};
const HEX=/^#[0-9a-fA-F]{6}$/;
const between=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
export function luminance(hex:string):number{
 if(!HEX.test(hex))return 0;
 const rgb=[1,3,5].map(p=>parseInt(hex.slice(p,p+2),16)/255)
   .map(n=>n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4));
 return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
export function contrast(a:string,b:string){
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function chroma(hex:string){
 const n=[1,3,5].map(p=>parseInt(hex.slice(p,p+2),16));
 return Math.max(...n)-Math.min(...n);
}
function pickPalette(brief:PosterBrief,intent:ArtIntent,style:PosterStyle){
 const palette=(brief.palette||[]).filter(x=>HEX.test(x)).map(x=>x.toUpperCase());
 const prefersDark=intent.renderIntent==='professional-ad'&&intent.kind!=='education'
   ||style==='bold'||intent.kind==='console'||intent.kind==='gaming';
 const dark=palette.find(c=>luminance(c)<.07)
   ||(prefersDark?'#080A10':'#F2F2ED');
 const light=palette.find(c=>luminance(c)>.7)||'#FFFFFF';
 const background=prefersDark?dark:light;
 const candidates=palette.filter(c=>contrast(c,background)>2.8&&chroma(c)>45)
   .sort((a,b)=>chroma(b)-chroma(a));
 const accent=candidates[0]||(prefersDark?'#00AEEF':'#2455ED');
 const ink=contrast(background,'#FFFFFF')>=4.5?'#FFFFFF':'#151922';
 const secondary=ink==='#FFFFFF'?'#C6D0DD':'#3D4752';
 return {background,accent,ink,secondary,light,shadow:'#070A12',
  isDark:ink==='#FFFFFF'};
}
function fitTitle(value:string,width:number,height:number,base:number,min=49):number{
 let size=base;
 for(;size>min;size-=2){
   const lines=value.split('\n').reduce((total,row)=>total+
     Math.max(1,Math.ceil(row.length/Math.max(1,Math.floor(width/(size*.52))))),0);
   if(lines*size*1.18<=height)break;
 }
 return Math.max(min,size);
}
function truncate(value:string,max:number):string{
 const s=value.replace(/\s+/g,' ').trim();
 if(s.length<=max)return s;
 const end=s.slice(0,max);const at=end.lastIndexOf(' ');
 return (at>max*.68?end.slice(0,at):end).trim();
}
export function composeProfessionalDesign(
 brief:PosterBrief,prompt:string,style:PosterStyle,format:PosterFormat,originalPrompt?:string
):PosterDesign{
 const [w,h]=formatPresets[format];
 const src=originalPrompt||prompt;
 const intent=extractArtIntent(src,prompt);
 const color=pickPalette(brief,intent,style);
 const c=color;
 const horizontal=w>h;
 const left=w*.08, right=w*.92;
 const scene=intent.kind==='console'||intent.kind==='gaming'?'gaming':
   intent.kind==='saas'?'software':
   intent.kind==='education'?'learning':
   intent.kind==='device'||intent.kind==='product'?'product':
   style==='editorial'?'editorial':'abstract';
 const subject=brief.brand||brief.subject||intent.brand;
 const branding=intent.brand||subject||'';
 const headline=truncate(brief.headline||src,105)||'Uma nova perspectiva';
 const deck=truncate(brief.subheadline||brief.concept||'',150);
 const cta=truncate(brief.callToAction||'Conheça mais',35);
 const els:PosterElement[]=[];
 let idx=0;
 const add=(type:string,x:number,y:number,width:number,height:number,attrs:Record<string,unknown>)=>{
  const round=(v:number)=>Math.round(v*10)/10;
  if(els.length>=46)return;
  els.push({id:'frame-'+String(++idx).padStart(2,'0')+'-'+type,type,
    x:round(x),y:round(y),width:round(Math.max(1,width)),height:round(Math.max(1,height)),
    rotation:0,opacity:1,...attrs});
 };
 const rect=(x:number,y:number,sw:number,sh:number,fill:string,rad=0,attrs:Record<string,unknown>={})=>
  add('rect',x,y,sw,sh,{fill,radius:rad,strokeWidth:0,...attrs});
 const ellipse=(x:number,y:number,sw:number,sh:number,fill:string,attrs:Record<string,unknown>={})=>
  add('ellipse',x,y,sw,sh,{fill,strokeWidth:0,...attrs});
 const poly=(x:number,y:number,sw:number,sh:number,sides:number,fill:string,attrs:Record<string,unknown>={})=>
  add('polygon',x,y,sw,sh,{sides,fill,strokeWidth:0,...attrs});
 const line=(x:number,y:number,sw:number,sh:number,fill:string,weight=3,attrs:Record<string,unknown>={})=>
  add('line',x,y,Math.max(1,sw),Math.max(1,sh),{fill,strokeWidth:weight,...attrs});
 const path=(x:number,y:number,sw:number,sh:number,data:string,fill:string,attrs:Record<string,unknown>={})=>
  add('path',x,y,sw,sh,{data,fill,strokeWidth:0,...attrs});
 const txt=(content:string,x:number,y:number,sw:number,sh:number,fs:number,fill:string,weight:'normal'|'bold'='normal',align:'left'|'center'|'right'='left')=>
  add('text',x,y,sw,sh,{content,fontSize:fs,fontWeight:weight,color:fill,align,fontFamily:'Inter'});
 const toMax=(v:number)=>between(v,1,240);
 // The first painted shapes form the atmosphere. Content is on top in z-order.
 const heroStart=horizontal?h*.18:h*.42;
 const heroBottom=horizontal?h*.86:h*.855;
 const heroH=heroBottom-heroStart;
 const middle=w*.5;
 // Geometric atmosphere varies by subject. Do not render the same ring for everything.
 if(scene==='gaming'){
  // Light streaks (vector perspective) frame a central console-like silhouette.
  const cx=middle,vanishY=heroStart+heroH*.79;
  const rays=horizontal?6:5;
  for(let i=0;i<rays;i++){
   const reach=i/(rays-1);
   const yy=heroStart+heroH*(.12+reach*.54);
   const x0=left*.15, x1=w*.99;
   const leftWidth=Math.max(8,cx-x0),rightWidth=Math.max(8,x1-cx);
   path(x0,yy,leftWidth,Math.max(2,vanishY-yy),
    `M 0 0 L ${leftWidth*.98} ${vanishY-yy} L ${Math.max(1,leftWidth-23)} ${vanishY-yy} L 0 ${Math.min(20,18+reach*10)} Z`,
    i%2?c.accent:c.ink,{opacity:.14+(.05*i)});
   path(cx,yy,rightWidth,Math.max(2,vanishY-yy),
    `M ${rightWidth} 0 L 0 ${vanishY-yy} L 22 ${vanishY-yy} L ${rightWidth} ${Math.min(20,18+reach*10)} Z`,
    i%2?c.accent:c.ink,{opacity:.13+(.055*i)});
  }
  // Broad neon axis, without relying on unsupported radial blur.
  ellipse(w*.2,heroStart+heroH*.40,w*.60,heroH*.42,c.accent,{opacity:.12,fillEnd:c.background});
  if(intent.kind==='console'){
   const cw=Math.min(w*.38,heroH*.46),ch=Math.min(heroH*.62,cw*1.43);
   const x=cx-cw*.5,y=heroStart+heroH*.19;
   // PS5-inspired abstracted silhouette: center slab + curved pale fins.
   rect(x+cw*.32,y+ch*.06,cw*.36,ch*.82,c.shadow,10);
   rect(x+cw*.37,y+ch*.11,cw*.26,ch*.72,'#191D28',8);
   path(x,y,cw*.40,ch,
     `M ${cw*.18} ${ch*.04} C ${cw*.03} ${ch*.24} 0 ${ch*.64} ${cw*.10} ${ch*.92} L ${cw*.39} ${ch*.92} L ${cw*.35} ${ch*.16} Z`,
     c.light,{opacity:.97});
   path(x+cw*.61,y,cw*.39,ch,
     `M ${cw*.19} ${ch*.04} C ${cw*.37} ${ch*.28} ${cw*.40} ${ch*.64} ${cw*.30} ${ch*.92} L 0 ${ch*.92} L ${cw*.02} ${ch*.16} Z`,
     c.light,{opacity:.98});
   rect(x+cw*.47,y+ch*.13,cw*.055,ch*.7,c.accent,3,{opacity:.96});
   ellipse(x+cw*.22,y+ch*.87,cw*.56,ch*.045,c.shadow,{opacity:.95});
   line(x+cw*.38,y+ch*.95,cw*.24,1,c.light,6);
  }else{
   // Gaming without a specified console: high-energy layered portal.
   poly(w*.33,heroStart+heroH*.22,w*.34,heroH*.5,4,c.accent,{rotation:45,opacity:.94});
   poly(w*.40,heroStart+heroH*.32,w*.20,heroH*.30,4,c.background,{rotation:45});
   line(w*.35,heroStart+heroH*.66,w*.30,1,c.ink,6);
  }
 }else if(scene==='software'){
  // Editorialized app architecture: three floating panes and a connection arc.
  const x=w*(horizontal?.60:.18),y=heroStart+heroH*.13,sw=w*(horizontal?.30:.64),sh=heroH*.65;
  rect(x,y,sw,sh,c.isDark?'#1A2534':'#DBE5F6',between(sw*.055,8,25),
    {stroke:c.accent,strokeWidth:3});
  rect(x+sw*.08,y+sh*.12,sw*.82,sh*.12,c.accent,8,{opacity:.95});
  for(let i=0;i<3;i++){
    rect(x+sw*.08,y+sh*(.35+i*.16),sw*(.48+.08*(i%2)),sh*.065,c.ink,5,{opacity:.20+.09*i});
    ellipse(x+sw*.76,y+sh*(.33+i*.16),sw*.12,sh*.105,c.accent,{opacity:.95});
  }
  poly(x-sw*.16,y+sh*.40,sw*.25,sh*.32,4,c.accent,{rotation:12,opacity:.85});
  line(x+sw*.03,y+sh*.91,sw*.96,1,c.accent,6,{opacity:.8});
 }else if(scene==='learning'){
  const x=w*(horizontal?.65:.22),y=heroStart+heroH*.1,sw=w*.5,sh=heroH*.7;
  poly(x,y,sw,sh,4,c.accent,{rotation:8,opacity:.9});
  rect(x+sw*.12,y+sh*.12,sw*.70,sh*.73,c.background,10);
  rect(x+sw*.21,y+sh*.28,sw*.51,sh*.055,c.ink,4);
  rect(x+sw*.21,y+sh*.40,sw*.34,sh*.055,c.accent,4);
  ellipse(x-sw*.15,y+sh*.6,sw*.24,sh*.25,c.ink,{opacity:.85});
 }else if(scene==='product'){
  const x=w*(horizontal?.61:.26),y=heroStart+heroH*.10,sw=w*.45,sh=heroH*.7;
  rect(x,y,sw,sh,c.isDark?'#222B3A':'#DEE3EB',35,{stroke:c.accent,strokeWidth:6,rotation:-9});
  rect(x+sw*.11,y+sh*.10,sw*.78,sh*.72,c.background,28,{rotation:-9});
  line(x+sw*.21,y+sh*.78,sw*.58,1,c.accent,11);
  poly(x-sw*.15,y+sh*.12,sw*.23,sh*.32,4,c.accent,{rotation:35,opacity:.65});
 }else{
  // Abstract/editorial: a deliberately off-center dimensional tunnel.
  const cy=heroStart+heroH*.52, sz=Math.min(w*.46,heroH*.62);
  for(let i=0;i<4;i++){
   const spread=i*sz*.145;
   poly(middle-sz*.5-spread*.16,cy-sz*.42+spread*.10,sz-spread,sz-spread,4,
    i%2===0?c.accent:c.background,{rotation:45,opacity:1,stroke:c.ink,strokeWidth:i===0?5:3});
  }
  line(w*.20,heroStart+heroH*.82,w*.60,1,c.accent,7,{opacity:.8});
  ellipse(w*.72,heroStart+heroH*.18,w*.09,heroH*.13,c.ink,{opacity:.85});
 }
 // Content is topmost and follows frame-safe gutters, not browser vw.
 const normalizedBrand=intent.brand||branding;
 const brandLabel=normalizedBrand&&normalizedBrand.length<=32?
    normalizedBrand.toUpperCase():(intent.renderIntent==='professional-ad'?'CAMPANHA':'');
 const textRight=horizontal?(scene==='software'||scene==='product'?w*.53:w*.57):right-left;
 const titleX=horizontal?left:left;
 const centerCopy=!horizontal&&(intent.renderIntent==='professional-ad'||style==='bold');
 const titleY=horizontal?h*.19:h*.115;
 const titleHeight=horizontal?h*.32:h*.165;
 const titleWidth=horizontal?textRight:right-left;
 const titleSize=fitTitle(headline,titleWidth,titleHeight,
   horizontal?Math.min(104,h*.116):Math.min(112,w*.095),horizontal?43:54);
 if(brandLabel)txt(brandLabel,titleX,h*.055,titleWidth,h*.05,
   horizontal?Math.min(25,h*.036):Math.min(31,w*.031),c.accent,'bold',centerCopy?'center':'left');
 txt(headline,titleX,titleY,titleWidth,titleHeight,toMax(titleSize),c.ink,'bold',centerCopy?'center':'left');
 if(deck){
  const subtitleY=horizontal?h*.55:h*.296;
  const subtitleWidth=horizontal?textRight:right-left;
  const subtitleSize=horizontal?Math.min(35,h*.048):Math.min(36,w*.036);
  txt(deck,titleX,subtitleY,subtitleWidth,h*(horizontal?.15:.105),subtitleSize,c.secondary,'normal',centerCopy?'center':'left');
 }
 if(cta){
  const ctaY=horizontal?h*.827:h*.900;
  const ctaW=horizontal?Math.min(w*.31,430):w*.57;
  const ctaX=centerCopy?(w-ctaW)*.5:left;
  rect(ctaX,ctaY,ctaW,h*(horizontal?.105:.067),c.accent,Math.min(10,h*.009));
  const ctaColor=contrast(c.accent,'#080A10')>=4.5?'#080A10':'#FFFFFF';
  txt(cta,ctaX+ctaW*.06,ctaY+h*.011,ctaW*.88,h*(horizontal?.082:.047),
    horizontal?Math.min(35,h*.05):Math.min(34,w*.032),ctaColor,'bold','center');
 }
 const design:PosterDesign={
  version:1,title:truncate(headline,85),description:truncate(brief.visualDirection||brief.concept||'',450),
  canvas:{width:w,height:h,background:c.background},
  elements:els,
 };
 return design;
}
export function auditProfessionalDesign(design:PosterDesign,subject?:ArtIntent):string[]{
 const issues:string[]=[];
 const {width:w,height:h}=design.canvas;
 const texts=design.elements.filter(e=>e.type==='text');
 if(!texts.some(e=>Number(e.fontSize)>=Math.min(55,w*.05)))issues.push('Título principal sem hierarquia tipográfica.');
 if(subject?.brand&&!subjectPresent(texts.map(e=>e.content||'').join(' '),subject)){
  issues.push('A peça omite a marca ou produto solicitado: '+subject.brand+'.');
 }
 for(const e of design.elements){
  if(e.x<-2||e.y<-2||e.x+e.width>w+2||e.y+e.height>h+2){
   issues.push('Elemento fora da área de desenho: '+e.id);
  }
 }
 for(const e of texts){
  if(!String(e.content||'').trim())issues.push('Texto vazio.');
  const size=Number(e.fontSize);
  if(size<26)issues.push('Texto muito pequeno: '+size+'px.');
  const lines=String(e.content||'').split('\n')
   .reduce((sum,row)=>sum+Math.max(1,Math.ceil(row.length/Math.max(1,Math.floor(e.width/(size*.50))))),0);
  if(lines*size*1.12>e.height*1.28)issues.push('Texto pode exceder a caixa: '+String(e.content).slice(0,40));
 }
 for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
  const a=texts[i],b=texts[j];
  const overlap=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*
    Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
  if(overlap>Math.min(a.width*a.height,b.width*b.height)*.12){
   issues.push('Camadas textuais sobrepostas.');
  }
 }
 const types=new Set(design.elements.filter(e=>e.type!=='text').map(e=>e.type));
 if(types.size<3)issues.push('Composição genérica: pouca diversidade de linguagem vetorial.');
 if(Math.max(0,...design.elements.map(e=>e.y+e.height))<h*.82){
  issues.push('Arte mal distribuída no terço inferior.');
 }
 return [...new Set(issues)].slice(0,12);
}
