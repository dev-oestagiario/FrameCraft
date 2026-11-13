import {describe,expect,it} from 'vitest';
import {extractArtIntent,enforceSubjectFidelity,subjectPresent} from '../src/lib/subjectFidelity';
import {composeProfessionalDesign,auditProfessionalDesign} from '../src/lib/proComposer';
import {designSchema} from '../src/lib/schema';

const PS5_BRIEF={
 headline:'Imersão sem limites, performance real.',
 subheadline:'Uma experiência de jogo envolvente em uma peça visual de alto impacto.',
 callToAction:'Saiba mais',
 palette:['#000000','#00AEEF','#FFFFFF'],
 visualDirection:'Campanha de alta energia, perspectiva, produto estilizado e foco cinematográfico.'
};
describe('Fidelidade ao pedido original',()=>{
 it('não apaga o PlayStation 5 quando o texto refinado fala apenas de geometria',()=>{
  const intent=extractArtIntent('Crie um banner para divulgar o PS5','preto, ciano, geometria abstrata');
  expect(intent.brand).toBe('PlayStation 5');
  expect(intent.kind).toBe('console');
  expect(intent.renderIntent).toBe('professional-ad');
  const repaired=enforceSubjectFidelity('geometria futurista','Poster abstrato em ciano','divulgação do ps5');
  expect(repaired).toMatch(/PlayStation 5/i);
 });
 it('mantém QA Hub como entidade distinta de um SaaS genérico',()=>{
  expect(extractArtIntent('Crie um post de divulgação do QA Hub').brand).toBe('QA Hub');
 });
 it('usa identificação visível na arte mesmo quando a headline não contém PS5',()=>{
  const prompt='Banner de divulgação para PS5 com silhueta vetorial e fundo preto e ciano';
  const intent=extractArtIntent(prompt);
  const design=composeProfessionalDesign(PS5_BRIEF,'DIREÇÃO DE ARTE ABSTRATA', 'bold','portrait',prompt);
  const printable=design.elements.filter(e=>e.type==='text').map(e=>String(e.content)).join(' ');
  expect(subjectPresent(printable,intent)).toBe(true);
  expect(printable).toMatch(/PLAYSTATION 5/);
  expect(design.elements.filter(e=>e.type==='path').length).toBeGreaterThanOrEqual(2);
  expect(design.canvas.background).toBe('#000000');
  const validation=designSchema.safeParse(design);
  expect(validation.success,validation.success?'':JSON.stringify(validation.error.issues)).toBe(true);
  expect(auditProfessionalDesign(design,intent)).toEqual([]);
 });
 it('produz layouts distintos para console e software sem variar aleatoriamente',()=>{
  const original='Crie banner PS5';
  const gaming=composeProfessionalDesign(PS5_BRIEF,original,'bold','portrait',original);
  const software=composeProfessionalDesign({...PS5_BRIEF,headline:'Organize seu QA',palette:['#101827','#4A78FD','#FFFFFF']},'divulgar QA Hub','studio','portrait','Divulgação do QA Hub');
  expect(gaming).toEqual(composeProfessionalDesign(PS5_BRIEF,original,'bold','portrait',original));
  expect(gaming.elements.filter(e=>e.type==='path').length).toBeGreaterThan(software.elements.filter(e=>e.type==='path').length);
 });
 it('rejeita SVG com código, sem executar HTML produzido pela IA',()=>{
  const design=composeProfessionalDesign(PS5_BRIEF,'PS5','bold','portrait','Banner PS5');
  const testPath=design.elements.find(e=>e.type==='path');
  expect(testPath).toBeTruthy();
  expect(designSchema.safeParse({...design,elements:[{...testPath,data:'<script>alert(1)</script>'}]}).success).toBe(false);
 });
});
