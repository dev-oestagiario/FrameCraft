import type { Design } from '../lib/schema';

export const qaHub: Design = {
  version: 1, title: 'QA Hub · Produtividade em QA',
  description: 'Campanha de lançamento da central inteligente de QA.',
  canvas: {width: 1080,height:1350,background:'#0B1921',backgroundEnd:'#10443F'},
  elements: [
    {id:'orb1',type:'ellipse',x:720,y:-170,width:540,height:540,fill:'#126760',rotation:0,opacity:.55},
    {id:'label',type:'text',x:85,y:94,width:700,height:36,content:'APRESENTANDO  /  QA HUB',fontSize:25,fontWeight:'bold',color:'#65E6C4',align:'left',fontFamily:'Inter',rotation:0,opacity:1},
    {id:'headline',type:'text',x:76,y:170,width:930,height:185,content:'Menos tarefas manuais.\nMais qualidade.',fontSize:88,fontWeight:'bold',color:'#FFFFFF',align:'left',fontFamily:'Inter',rotation:0,opacity:1},
    {id:'subhead',type:'text',x:83,y:380,width:830,height:100,content:'Do requisito à evidência. Um fluxo completo para seu time de QA.',fontSize:33,fontWeight:'normal',color:'#B4D8D3',align:'left',fontFamily:'Inter',rotation:0,opacity:1},
    {id:'panel',type:'rect',x:78,y:525,width:924,height:505,fill:'#F5FBFA',radius:38,rotation:0,opacity:1,strokeWidth:0},
    {id:'panel-brand',type:'text',x:119,y:572,width:650,height:58,content:'QA Hub  /  Workspace',fontSize:32,fontWeight:'bold',color:'#143338',align:'left',fontFamily:'Inter',rotation:0,opacity:1},
    {id:'pill1',type:'rect',x:121,y:684,width:397,height:121,fill:'#DBF8EB',radius:20,rotation:0,opacity:1,strokeWidth:0},
    {id:'pill2',type:'rect',x:543,y:684,width:403,height:121,fill:'#DDF0F5',radius:20,rotation:0,opacity:1,strokeWidth:0},
    {id:'pill3',type:'rect',x:121,y:825,width:397,height:121,fill:'#E9EBFF',radius:20,rotation:0,opacity:1,strokeWidth:0},
    {id:'pill4',type:'rect',x:543,y:825,width:403,height:121,fill:'#F5ECD8',radius:20,rotation:0,opacity:1,strokeWidth:0},
    {id:'pilltext1',type:'text',x:144,y:716,width:350,height:67,content:'✓  Tarefas organizadas',fontSize:29,fontWeight:'bold',color:'#163B34',align:'left',fontFamily:'Inter',rotation:0,opacity:1},
    {id:'pilltext2',type:'text',x:568,y:716,width:360,height:65,content:'✳  Testes com IA',fontSize:29,fontWeight:'bold',color:'#17444D',align:'left',fontFamily:'Inter',rotation:0,opacity:1},
    {id:'pilltext3',type:'text',x:144,y:856,width:350,height:66,content:'▤  Posts técnicos',fontSize:29,fontWeight:'bold',color:'#353962',align:'left',fontFamily:'Inter',rotation:0,opacity:1},
    {id:'pilltext4',type:'text',x:568,y:856,width:360,height:66,content:'◇  Diagramas',fontSize:29,fontWeight:'bold',color:'#594524',align:'left',fontFamily:'Inter',rotation:0,opacity:1},
    {id:'footer',type:'text',x:85,y:1103,width:888,height:67,content:'Da tarefa à entrega. Tudo conectado.',fontSize:36,fontWeight:'bold',color:'#FFFFFF',align:'left',fontFamily:'Inter',rotation:0,opacity:1},
    {id:'button',type:'rect',x:85,y:1210,width:910,height:91,fill:'#40E3BA',radius:26,rotation:0,opacity:1,strokeWidth:0},
    {id:'buttontext',type:'text',x:123,y:1228,width:835,height:54,content:'CONHEÇA O QA HUB   ↗',fontSize:30,fontWeight:'bold',color:'#09282B',align:'center',fontFamily:'Inter',rotation:0,opacity:1},
  ],
};

export const workshop: Design = {
  version:1,title:'Oficina criativa',description:'Composição editorial para workshop',
  canvas:{width:1080,height:1350,background:'#F5F1E9',backgroundEnd:'#EBE8DF'},
  elements:[
    {id:'circle1',type:'ellipse',x:654,y:30,width:515,height:515,rotation:0,opacity:1,fill:'#F8A66C'},
    {id:'circle2',type:'ellipse',x:746,y:440,width:220,height:220,rotation:0,opacity:1,fill:'#2F6B63'},
    {id:'small',type:'text',x:80,y:74,width:690,height:62,rotation:0,opacity:1,content:'ESTÚDIO  /  EVENTOS',fontSize:24,fontWeight:'bold',color:'#314E49',align:'left',fontFamily:'Inter'},
    {id:'big',type:'text',x:80,y:220,width:880,height:340,rotation:0,opacity:1,content:'Ideias que\nsaem do papel.',fontSize:112,fontWeight:'bold',color:'#1E3939',align:'left',fontFamily:'Inter'},
    {id:'stripe',type:'rect',x:80,y:663,width:917,height:8,rotation:0,opacity:1,fill:'#1E3939',radius:4,strokeWidth:0},
    {id:'slogan',type:'text',x:80,y:730,width:885,height:180,rotation:0,opacity:1,content:'Uma experiência criativa para transformar conceitos em projetos reais.',fontSize:42,fontWeight:'normal',color:'#415958',align:'left',fontFamily:'Georgia'},
    {id:'date',type:'rect',x:80,y:1050,width:920,height:180,rotation:0,opacity:1,fill:'#1E3939',radius:24,strokeWidth:0},
    {id:'dateText',type:'text',x:118,y:1090,width:825,height:110,rotation:0,opacity:1,content:'INSCRIÇÕES ABERTAS  ↗',fontSize:48,fontWeight:'bold',color:'#FFFFFF',align:'left',fontFamily:'Inter'}
  ]
};
export const templateOptions=[{id:'qa',label:'QA Hub',doc:qaHub},{id:'workshop',label:'Editorial',doc:workshop}];
