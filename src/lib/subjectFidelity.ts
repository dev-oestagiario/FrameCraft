/**
 * FrameCraft's source-of-truth intent, shared by Node, Deno and the editor.
 * Never replace a named subject with a generic aesthetic descriptor.
 */
export type ArtIntent = {
  subject:string;
  brand:string;
  kind:'console'|'gaming'|'saas'|'device'|'education'|'product'|'abstract';
  mustInclude:string[];
  renderIntent:'professional-ad'|'editorial'|'simple-post';
};
const KNOWN=[
 {pattern:/\b(?:ps\s*5|playstation\s*5|playstation\s*five)\b/i,name:'PlayStation 5',short:'PS5',kind:'console' as const},
 {pattern:/\b(?:ps\s*4|playstation\s*4)\b/i,name:'PlayStation 4',short:'PS4',kind:'console' as const},
 {pattern:/\bxbox\s*(?:series\s*[xs]|one|360)?\b/i,name:'Xbox',short:'XBOX',kind:'console' as const},
 {pattern:/\bnintendo\s*switch\b/i,name:'Nintendo Switch',short:'NINTENDO SWITCH',kind:'console' as const},
 {pattern:/\bqa[\s-]?hub\b/i,name:'QA Hub',short:'QA HUB',kind:'saas' as const},
 {pattern:/\bframecraft\b/i,name:'FrameCraft',short:'FRAMECRAFT',kind:'saas' as const},
 {pattern:/\bblock[\s-]?doom\b/i,name:'Block Doom',short:'BLOCK DOOM',kind:'education' as const},
 {pattern:/\biphone(?:\s*\d+(?:\s*pro)?)?\b/i,name:'iPhone',short:'IPHONE',kind:'device' as const},
 {pattern:/\bipad\b/i,name:'iPad',short:'IPAD',kind:'device' as const},
 {pattern:/\bmacbook\b/i,name:'MacBook',short:'MACBOOK',kind:'device' as const}
];
function textOnly(value:string){return value.normalize('NFKC').replace(/\s+/g,' ').trim();}
function brandLikeCandidate(input:string):string{
 const m=input.match(/\b(?:divulga(?:ção|r)|promover|promoção|anúncio|banner|post|campanha|lançamento)\s+(?:\w+\s+){0,5}?(?:do|da|de|para o|para a)\s+([\p{L}\p{N}][\p{L}\p{N} ._-]{1,55})/iu);
 if(!m)return '';
 return (m[1]||'').split(/[,.;\n]|\b(?:com|usando|no estilo|destacando|que|onde|e uma|e um)\b/i)[0].trim().slice(0,52);
}
export function extractArtIntent(original:string,enhanced=''):ArtIntent{
 const source=textOnly(original||enhanced);
 // Prioritize the human's original wording; the model can add suggestions, not erase the subject.
 const hay=[source,enhanced].filter(Boolean).join(' ');
 const known=KNOWN.find(item=>item.pattern.test(source))||KNOWN.find(item=>item.pattern.test(enhanced));
 const named=known?.name||brandLikeCandidate(source);
 const brand=named||'';
 const gaming=/\b(?:gamer|games?|videogame|console|jogos?|playstation|xbox|nintendo|ps\s*5)\b/i.test(hay);
 const saas=/\b(?:software|sistema|plataforma|aplicativo|app|saas|erp|dashboard|qa\s*hub)\b/i.test(hay);
 const education=/\b(?:educação|educacional|escola|alunos?|professores?|aula|ensino)\b/i.test(hay);
 const device=/\b(?:iphone|ipad|macbook|smartphone|celular|tablet|notebook)\b/i.test(hay);
 const kind:ArtIntent['kind']=known?.kind||(gaming?'gaming':saas?'saas':education?'education':device?'device':named?'product':'abstract');
 const campaign=/\b(?:banner|campanha|lançamento|divulgação|anúncio|publicidade|promocional|propaganda|marketing|impacto)\b/i.test(hay);
 const editorial=/\b(?:editorial|revista|capa|artigo)\b/i.test(hay);
 const renderIntent:ArtIntent['renderIntent']=campaign?'professional-ad':editorial?'editorial':'simple-post';
 return {subject:named||'Assunto descrito pelo usuário',brand,
  kind,mustInclude:named?[named]:[],
  renderIntent};
}
export function enforceSubjectFidelity(prompt:string,enhanced:string,original=''):string{
 const intent=extractArtIntent(original||prompt,enhanced);
 if(!intent.mustInclude.length)return enhanced;
 const missing=intent.mustInclude.filter(term=>!new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(enhanced));
 if(!missing.length)return enhanced;
 return 'ASSUNTO OBRIGATÓRIO (não substituir por abstração genérica): '+missing.join(', ')+'.\n'
   +'Incluir identificação visível e elementos relacionados ao produto ou marca.\n\n'+enhanced;
}
export function subjectPresent(designText:string,intent:ArtIntent):boolean{
 if(!intent.brand)return true;
 if(intent.brand==='PlayStation 5')return /\b(?:playstation\s*5|ps\s*5)\b/i.test(designText);
 if(intent.brand==='PlayStation 4')return /\b(?:playstation\s*4|ps\s*4)\b/i.test(designText);
 return designText.toLocaleLowerCase('pt-BR').includes(intent.brand.toLocaleLowerCase('pt-BR'));
}
