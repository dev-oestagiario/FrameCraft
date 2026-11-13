import {describe,expect,it} from 'vitest';
import {composePremiumCampaign} from '../src/lib/premiumCampaign';
import {designSchema} from '../src/lib/schema';
const fake='data:image/jpeg;base64,'+'A'.repeat(1400);
const brief={
 concept:'Uma experiência gastronômica premium',
 audience:'Adultos',
 headline:'Hambúrguer que impressiona',
 subheadline:'Ingredientes selecionados e sabor excepcional.',
 visualDirection:'Fundo preto e iluminação premium no hero',
 typography:'Georgia e Inter',
 palette:['#0A0A0A','#FF8C42','#FFFFFF'],
 hierarchy:'Headline forte, hero central e CTA',
 callToAction:'Descubra mais',
};
describe('Campanhas híbridas com imagem real',()=>{
 it('usa pixels reais do produto em vez de geometria abstrata',()=>{
  const design=composePremiumCampaign(brief,'Banner do hambúrguer gourmet','portrait','studio',fake);
  expect(designSchema.safeParse(design).success).toBe(true);
  expect(design.elements.filter(e=>e.type==='image')).toHaveLength(1);
  const hero=design.elements.find(e=>e.type==='image');
  expect(hero?.src).toBe(fake);
  expect(hero?.fit).toBe('cover');
  expect(design.elements.find(e=>e.type==='text'&&e.content.includes('Hambúrguer'))).toBeTruthy();
  expect(design.elements.find(e=>e.type==='text'&&e.content.includes('Descubra'))).toBeTruthy();
  expect(design.elements.some(e=>e.type==='polygon'||e.type==='star')).toBe(false);
 });
 it('preserva proporções e posições para todos os formatos',()=>{
  for(const format of ['portrait','square','story','landscape','banner'] as const){
   const design=composePremiumCampaign(brief,'Campanha hambúrguer',format,'editorial',fake,'uploaded');
   expect(designSchema.safeParse(design).success).toBe(true);
   expect(design.elements.every(e=>e.x>=0&&e.y>=0&&e.x+e.width<=design.canvas.width+2&&e.y+e.height<=design.canvas.height+2)).toBe(true);
  }
 });
 it('preserva imagens do usuário e mantém textos editáveis',()=>{
  const design=composePremiumCampaign(brief,'Promoção hambúrguer','portrait','bold',fake,'uploaded');
  expect(design.elements.some(e=>e.type==='image'&&e.src===fake)).toBe(true);
  expect(design.elements.filter(e=>e.type==='text').length).toBeGreaterThanOrEqual(3);
 });
 it('não admite imagens remotas nem código HTML',()=>{
  const design=composePremiumCampaign(brief,'hambúrguer','portrait','studio',fake);
  const bad={...design,elements:design.elements.map(e=>e.type==='image'?{...e,src:'https://evil.example/image.jpg'}:e)};
  expect(designSchema.safeParse(bad).success).toBe(false);
 });
});
