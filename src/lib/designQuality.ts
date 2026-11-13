import type {Design, TextElement} from './schema';

/** Fast geometric advisory checks; no false claim of pixel-perfect text measurement. */
export function analyzeLayout(design: Design): string[] {
 const issues:string[]=[];
 const {width,height}=design.canvas;
 const texts=design.elements.filter((el):el is TextElement=>el.type==='text');
 for(const el of design.elements){
   const name=el.type==='text'?`“${el.content.slice(0,22)}”`:`${el.type} (${el.id.slice(0,12)})`;
   if(el.x < 0 || el.y < 0 || el.x + el.width > width || el.y + el.height > height){
     issues.push(`${name}: ultrapassa os limites do canvas.`);
   }
 }
 for(const el of texts){
   const estimatedCharsPerLine=Math.max(1,Math.floor(el.width/(el.fontSize*.56)));
   const approxLines=el.content.split('\n').reduce((total,line)=>total+Math.max(1,Math.ceil(line.length/estimatedCharsPerLine)),0);
   if(approxLines*el.fontSize*1.12>el.height*1.35){
     issues.push(`“${el.content.slice(0,22)}”: a caixa de texto pode ser pequena para o conteúdo.`);
   }
 }
 for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
   const a=texts[i],b=texts[j];
   const intersection=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)) * Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
   if(intersection>Math.min(a.width*a.height,b.width*b.height)*.20){
     issues.push(`Textos “${a.content.slice(0,15)}” e “${b.content.slice(0,15)}” podem se sobrepor.`);
   }
 }
 return issues;
}
