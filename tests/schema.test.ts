import {describe,it,expect} from 'vitest';
import {qaHub,workshop} from '../src/data/templates';
import {designSchema,formats,normalizeDesign,briefSchema} from '../src/lib/schema';

describe('Contrato JSON',()=>{
 it('valida o template do QA Hub',()=>{expect(designSchema.parse(qaHub).elements.length).toBeGreaterThan(5)});
 it('valida o template editorial',()=>{expect(designSchema.parse(workshop).title).toBe('Oficina criativa')});
 it('bloqueia elemento com imagem URL remota',()=>{
  const d=structuredClone(qaHub);d.elements.push({type:'image',src:'https://example.com/asset.jpg',id:'invalid',x:1,y:1,width:10,height:10,rotation:0,opacity:1} as never);
  expect(designSchema.safeParse(d).success).toBe(false);
 });
 it('normaliza ids duplicados',()=>{
  const d=structuredClone(qaHub);d.elements[1].id=d.elements[0].id;
  const clean=normalizeDesign(d);expect(new Set(clean.elements.map(x=>x.id)).size).toBe(clean.elements.length);
 });
 it('normaliza ids duplicados com colisões no sufixo',()=>{
  const d=structuredClone(qaHub);d.elements[0].id='duplicado';d.elements[1].id='duplicado';d.elements[2].id='duplicado-1';
  const clean=normalizeDesign(d);
  expect(new Set(clean.elements.map(x=>x.id)).size).toBe(clean.elements.length);
 });
 it('formatos padronizados válidos',()=>{expect(formats.portrait.width).toBe(1080);expect(formats.story.height).toBe(1920)});
 it('rejeita paleta inválida',()=>{expect(briefSchema.safeParse({concept:'teste',palette:['white']}).success).toBe(false)})
});
