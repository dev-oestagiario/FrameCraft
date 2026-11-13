/**
 * Hybrid ad compositor: image-generation produces the hero; React Konva owns
 * editable typography, contrast overlays and CTA. No generic geometric stand-in.
 * All data URIs are validated by the strict Zod schema before entering the editor.
 */
import {designSchema,type Design,type DesignElement,type CreativeBrief} from './schema';
import {extractArtIntent} from './subjectFidelity';
import {formatPresets,type PosterFormat,type PosterStyle} from './proComposer';

const HEX=/^#[0-9a-fA-F]{6}$/;
const choose=(value:unknown,fallback:string)=>typeof value==='string'&&HEX.test(value)?value.toUpperCase():fallback;
const shorten=(value:string,max:number)=>{
 const text=value.replace(/\s+/g,' ').trim();
 if(text.length<=max)return text;
 return text.slice(0,max-1).replace(/\s+\S*$/,'')+'…';
};
function fontFor(text:string,width:number,initial:number,min:number){
 const chars=Math.max(10,Math.floor(width/(initial*.49)));
 const rows=Math.ceil(text.length/chars);
 return rows>2?Math.max(min,Math.floor(initial*.78)):initial;
}
export function composePremiumCampaign(
 brief:CreativeBrief,originalPrompt:string,format:PosterFormat,style:PosterStyle,
 imageSrc:string,source:'generated'|'uploaded'='generated'
):Design{
 const [w,h]=formatPresets[format];
 const horizontal=w>h;
 const intent=extractArtIntent(originalPrompt);
 const isFood=/\b(hamb[úu]rguer|burger|lanche|pizza|comida|prato|gastronomia|sabor|restaurante|doces?|café)\b/i.test(originalPrompt);
 const dark=choose(brief.palette.find(c=>HEX.test(c)&&/^#(?:0[0-9a-f]|1[0-9a-f]|2[0-9a-f])/i.test(c)),
   isFood?'#0A0A0A':'#0D1119');
 const bright=choose(brief.palette.find(c=>HEX.test(c)&&c.toLowerCase()!==dark.toLowerCase()&&!/^#(?:f{6}|ffffff)$/i.test(c)),isFood?'#FF8C42':'#69D3EF');
 const white='#FFFFFF',muted='#E0E3E8';
 const text = shorten(brief.headline||'Uma experiência diferente',horizontal?75:72);
 const subtitle=shorten(brief.subheadline||'',horizontal?115:130);
 const cta=shorten(brief.callToAction||'Saiba mais',30);
 const brand=intent.brand&&!/^(assunto descrito|assunto solicitado)/i.test(intent.brand)
   ?shorten(intent.brand.toUpperCase(),26):'';
 const els:DesignElement[]=[];
 const box=(id:string,x:number,y:number,width:number,height:number,fill:string,opacity=1,radius=0):void=>{
  els.push({type:'rect',id,x:Math.round(x),y:Math.round(y),width:Math.round(width),height:Math.round(height),
   fill,opacity,rotation:0,radius,strokeWidth:0});
 };
 const label=(id:string,value:string,x:number,y:number,width:number,height:number,size:number,
   color:string,weight:'normal'|'bold'='normal',align:'left'|'center'='left',font:'Inter'|'Georgia'='Inter'):void=>{
   if(!value)return;
   els.push({type:'text',id,content:value,x:Math.round(x),y:Math.round(y),width:Math.round(width),
    height:Math.round(height),rotation:0,opacity:1,fontSize:Math.round(size),
    fontWeight:weight,fontFamily:font,color,align});
 };
 const isPoster=style==='editorial'||isFood;
 if(horizontal){
  box('fc-base',0,0,w,h,dark);
  els.push({type:'image',id:'fc-photo-hero',x:Math.round(w*.40),y:0,width:Math.round(w*.60),
   height:h,rotation:0,opacity:1,fit:'cover',src:imageSrc});
  // Readable left column; no overlay on the product's face.
  box('fc-left-panel',0,0,w*.445,h,dark,.96);
  box('fc-accent-bar',w*.075,h*.10,w*.06,6,bright);
  if(brand)label('fc-brand',brand,w*.075,h*.145,w*.41,h*.07,Math.max(23,h*.042),bright,'bold');
  label('fc-headline',text,w*.075,h*.255,w*.38,h*.30,fontFor(text,w*.40,Math.min(81,h*.111),48),white,'bold','left',isPoster?'Georgia':'Inter');
  label('fc-subtitle',subtitle,w*.075,h*.59,w*.37,h*.15,Math.min(29,h*.050),muted);
  box('fc-cta-bg',w*.075,h*.80,w*.26,h*.096,bright,1,9);
  label('fc-cta',cta,w*.095,h*.807,w*.22,h*.080,Math.min(27,h*.049),'#101114','bold','center');
 }else{
  box('fc-base',0,0,w,h,dark);
  els.push({type:'image',id:'fc-photo-hero',x:0,y:Math.round(h*.31),width:w,
    height:Math.round(h*.57),rotation:0,opacity:1,fit:'cover',src:imageSrc});
  box('fc-photo-top-fade',0,h*.31,w,h*.055,dark,.40);
  box('fc-photo-bottom-fade',0,h*.835,w,h*.045,dark,.58);
  box('fc-top-panel',0,0,w,h*.31,dark,.99);
  box('fc-bottom-panel',0,h*.88,w,h*.12,dark,.99);
  box('fc-accent-bar',w*.095,h*.052,w*.065,6,bright);
  if(brand)label('fc-brand',brand,w*.095,h*.073,w*.81,h*.040,Math.min(29,w*.026),bright,'bold');
  const headlineY=brand?h*.123:h*.096;
  const headlineFont=fontFor(text,w*.82,Math.min(89,w*.079),48);
  label('fc-headline',text,w*.09,headlineY,w*.82,h*.137,headlineFont,white,'bold','center',isPoster?'Georgia':'Inter');
  label('fc-subtitle',subtitle,w*.10,h*.265,w*.80,h*.056,Math.min(30,w*.027),muted,'normal','center');
  const ctaw=Math.min(w*.47,450);
  const ctah=Math.min(75,h*.057);
  const ctax=w-ctaw-w*.095,ctay=h*.915;
  box('fc-cta-bg',ctax,ctay,ctaw,ctah,bright,1,Math.min(12,ctah*.16));
  label('fc-cta',cta,ctax+12,ctay+ctah*.10,ctaw-24,ctah*.78,
    Math.min(28,ctah*.43),'#101114','bold','center');
 }
 return designSchema.parse({
  version:1,title:shorten(brief.headline||'Campanha',85),
  description:`Campanha híbrida com hero ${source==='uploaded'?'enviado pelo usuário':'gerado por IA'}; textos e layout editáveis.`,
  canvas:{width:w,height:h,background:dark},elements:els
 });
}
