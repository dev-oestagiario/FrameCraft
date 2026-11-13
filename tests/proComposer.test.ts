import {describe,expect,it} from 'vitest';
import {designSchema} from '../src/lib/schema';
import {auditProfessionalDesign,composeProfessionalDesign,contrast} from '../src/lib/proComposer';
const brief={
 headline:'QA Hub: testes organizados sem retrabalho',
 subheadline:'Da tarefa aos cenários e evidências em um só fluxo.',
 callToAction:'Conheça o QA Hub',
 palette:['#FFFFFF','#25B998','#0A2830'],
 visualDirection:'Identidade editorial para uma ferramenta QA.'
};
describe('Direção de arte profissional',()=>{
 it.each(['portrait','square','story','landscape','banner'] as const)('produz JSON validado no formato %s',format=>{
   const design=composeProfessionalDesign(brief,'Criar post para QA Hub','studio',format);
   expect(designSchema.safeParse(design).success).toBe(true);
   expect(design.elements.some(e=>e.type==='polygon')).toBe(true);
   expect(design.elements.some(e=>e.type==='line')).toBe(true);
   expect(design.elements.filter(e=>e.type==='text').length).toBeGreaterThanOrEqual(3);
   expect(auditProfessionalDesign(design)).toEqual([]);
 });
 it.each(['studio','bold','editorial','minimal','playful'] as const)('mantém hierarquia e áreas seguras em %s',style=>{
   const design=composeProfessionalDesign(brief,'Campanha de software QA',style,'portrait');
   expect(auditProfessionalDesign(design)).toEqual([]);
 });
 it('não inventa claim grátis no CTA',()=>{
   const design=composeProfessionalDesign(brief,'Campanha tecnológica','minimal','square');
   expect(design.elements.map(e=>e.content||'').join(' ')).not.toContain('grátis');
 });
 it('conserva contraste entre texto e fundo escuro',()=>{
   expect(contrast('#F8FFF9','#0B1C24')).toBeGreaterThan(10);
 });
});
