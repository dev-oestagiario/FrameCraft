import { designSchema, type Design } from './schema';
export function downloadText(text:string,name:string,mime='application/json'){
 const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);downloadUrl(url,name);setTimeout(()=>URL.revokeObjectURL(url),1500);
}
export function downloadUrl(url:string,name:string){const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();}
export function saveJSON(d:Design){downloadText(JSON.stringify(d,null,2), `${slug(d.title)}.json`)}
export function slug(s:string){return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'design';}
export async function readDesign(f:File){if(f.size>7_000_000)throw new Error('JSON excedeu 7 MB');return designSchema.parse(JSON.parse(await f.text()));}
export async function readImage(f:File):Promise<string>{
 if(!['image/png','image/jpeg','image/webp'].includes(f.type)) throw new Error('Use PNG, JPG ou WebP');
 if(f.size>3_000_000) throw new Error('A imagem deve ter até 3 MB');
 return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('Falha ao ler imagem'));r.readAsDataURL(f)});
}
