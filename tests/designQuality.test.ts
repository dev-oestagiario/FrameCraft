import {expect,it} from 'vitest';
import {analyzeLayout} from '../src/lib/designQuality';
import type {Design} from '../src/lib/schema';
const doc:Design={version:1,title:'Test',description:'',canvas:{width:1080,height:1080,background:'#000000'},elements:[{id:'t1',type:'text',content:'Título',x:100,y:100,width:300,height:100,fontSize:40,align:'left',fontFamily:'Inter',fontWeight:'bold',color:'#FFFFFF',rotation:0,opacity:1}]};
it('recognizes a text box inside the canvas',()=>{expect(analyzeLayout(doc)).toEqual([])});
it('warns when elements exceed the canvas',()=>{const next:Design={...doc,elements:[{...doc.elements[0],x:1000}]};expect(analyzeLayout(next).some(x=>x.includes('limites'))).toBe(true)});
