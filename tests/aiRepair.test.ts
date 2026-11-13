import {describe,it,expect} from 'vitest';
import {repairAiDesign,repairAiBrief,normalizeAiColor,normalizeAiFont} from '../server/aiRepair';
import {designSchema,briefSchema} from '../src/lib/schema';

const size={width:1080,height:1350};
const raw={version:1,title:'QA Hub',canvas:{width:999,height:800,background:'rgb(10,20,30)',backgroundEnd:'#abc'},elements:[
  {id:'title',type:'text',content:'QA Hub',x:80,y:100,width:800,height:180,fontFamily:'Montserrat',color:'#fff',fontSize:'84px',fontWeight:800},
  {id:'e4',type:'rect',x:80,y:400,width:400,height:120,fill:'rgba(33, 150, 243, 0.6)',radius:20},
  {id:'e5',type:'rect',x:80,y:550,width:400,height:120,fill:'linear-gradient(180deg, #36C 0%, #12ABEF 100%)'},
  {id:'e6',type:'ellipse',x:80,y:700,width:220,height:220,fill:'teal'},
  {id:'e11',type:'rect',x:80,y:950,width:400,height:100,fill:'#1234'},
  {id:'e12',type:'rect',x:80,y:1090,width:400,height:100,fill:'#00000080'},
]};

describe('AI content tolerance and strict output contract',()=>{
  it('normalizes palette colors from RGB, short hex, named and gradients',()=>{
    expect(normalizeAiColor('#abc')).toBe('#AABBCC');
    expect(normalizeAiColor('rgba(255, 0, 128, 0.7)')).toBe('#FF0080');
    expect(normalizeAiColor('navy')).toBe('#000080');
    expect(normalizeAiColor('linear-gradient(#12a, #fff)')).toBe('#1122AA');
    expect(normalizeAiColor('hsl(0, 100%, 50%)')).toBe('#FF0000');
    expect(normalizeAiColor('not-a-valid-color','#0A0B0C')).toBe('#0A0B0C');
  });
  it('converts unsupported fonts rather than failing validation',()=>{
    expect(normalizeAiFont('Montserrat')).toBe('Inter');
    expect(normalizeAiFont('Georgia, serif')).toBe('Georgia');
    expect(normalizeAiFont('Roboto, sans-serif')).toBe('Arial');
  });
  it('repairs multiple invalid fill fields and fontFamily on generated compositions',()=>{
    const result=repairAiDesign(raw,size,['#001122','#36D6B0']);
    expect(designSchema.safeParse(result.design).success).toBe(true);
    expect(result.design.canvas).toEqual({width:1080,height:1350,background:'#0A141E',backgroundEnd:'#AABBCC'});
    const [t,...shapes]=result.design.elements;
    expect(t.type==='text'&&t.fontFamily).toBe('Inter');
    expect(shapes.map(s=>s.type!=='text'&&s.type!=='image'?s.fill:null)).toEqual(['#2196F3','#3366CC','#008080','#112233','#000000']);
    expect(shapes[0].opacity).toBeCloseTo(.6,2);
    expect(shapes[4].opacity).toBeCloseTo(.502,2);
    expect(result.repairs.length).toBeGreaterThanOrEqual(6);
  });
  it('handles missing optional attributes, duplicate IDs and out-of-range dimensions',()=>{
    const result=repairAiDesign({title:'Exemplo',canvas:{background:'fundo azul'},elements:[
      {type:'text',id:'x',text:'Texto',x:'120px',y:90,width:'800',height:'130',fontFamily:'Poppins',color:'white'},
      {type:'circle',id:'x',x:0,y:0,width:80,height:80,fill:'transparent',opacity:0.8},
    ]},size);
    expect(result.design.elements[0].x).toBe(120);
    expect(new Set(result.design.elements.map(e=>e.id)).size).toBe(2);
    expect(result.design.elements[1].opacity).toBe(0);
    expect(designSchema.safeParse(result.design).success).toBe(true);
  });
  it('does not pretend empty or unsupported responses were successful',()=>{
    expect(()=>repairAiDesign({elements:[]},size)).toThrow('não retornou elementos');
    expect(()=>repairAiDesign({elements:[{type:'javascript',value:'alert(1)'}]},size)).toThrow('Nenhum elemento');
  });
  it('repairs invalid creative-brief palettes',()=>{
    const brief={concept:'Post de divulgação QA',audience:'Profissionais de QA',headline:'QA Hub',subheadline:'Teste rápido',visualDirection:'Layout de alto contraste',typography:'Inter',palette:['#abc','rgb(2, 80, 40)','teal'],hierarchy:'Título grande, CTA',callToAction:'Conheça'};
    const fixed=repairAiBrief(brief);
    expect(briefSchema.safeParse(fixed).success).toBe(true);
    expect(fixed.palette).toEqual(['#AABBCC','#025028','#008080']);
  });
});
