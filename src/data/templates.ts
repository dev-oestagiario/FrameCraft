import type {Design} from '../lib/schema';
import {designSchema} from '../lib/schema';
import {composeProfessionalDesign} from '../lib/proComposer';

const qaBrief={
  headline:'QA Hub: do teste à entrega, com clareza',
  subheadline:'Organize tarefas, casos de teste e evidências em um só fluxo.',
  callToAction:'Conheça o QA Hub',
  concept:'Produtividade e clareza para profissionais de qualidade de software.',
  palette:['#0B1C24','#59E6B5','#F6FFF8'],
  visualDirection:'Identidade geométrica contemporânea, contraste forte e título editorial de destaque.',
};
const workshopBrief={
  headline:'Crie. Explore. Transforme.',
  subheadline:'Uma oficina para tirar ideias do papel e criar experiências.',
  callToAction:'Saiba mais',
  concept:'Criatividade e aprendizagem prática.',
  palette:['#124B45','#F0A461','#FAF7F0'],
  visualDirection:'Peça editorial com formas expressivas, tipografia dominante e contraste suave.',
};
export const qaHub:Design=designSchema.parse(composeProfessionalDesign(qaBrief,'Divulgação do QA Hub','studio','portrait'));
export const workshop:Design={...designSchema.parse(composeProfessionalDesign(workshopBrief,'Oficina de criação','editorial','portrait')),title:'Oficina criativa'};
export const templateOptions=[
 {id:'qa',label:'QA Hub',doc:qaHub},
 {id:'workshop',label:'Editorial',doc:workshop}
];
