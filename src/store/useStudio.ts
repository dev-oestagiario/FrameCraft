import {create} from 'zustand';
import { qaHub } from '../data/templates';
import { designSchema, type Design, type DesignElement, type CreativeBrief } from '../lib/schema';

const key='ai-image-studio:v1';
function initial():Design{
 try {const raw=localStorage.getItem(key);if(raw)return designSchema.parse(JSON.parse(raw));} catch {/* invalid local state */}
 return structuredClone(qaHub);
}
const init=initial();
type StudioState={
  design:Design; selectedId:string|null; brief:CreativeBrief|null; loading:boolean; error:string|null;
  undoStack:Design[]; redoStack:Design[];
  setDesign:(d:Design)=>void;patchElement:(id:string,patch:Partial<DesignElement>)=>void;
  addElement:(el:DesignElement)=>void;removeSelected:()=>void;select:(id:string|null)=>void;
  undo:()=>void;redo:()=>void;setBrief:(b:CreativeBrief|null)=>void;
  setLoading:(v:boolean)=>void;setError:(e:string|null)=>void;reset:()=>void;
};
function persist(d:Design){try{localStorage.setItem(key,JSON.stringify(d))}catch{/* large image */}}
function commit(prev:StudioState,next:Design){persist(next);return {design:next,undoStack:[...prev.undoStack.slice(-24),structuredClone(prev.design)],redoStack:[]}}
export const useStudio=create<StudioState>((set,get)=>({
 design:init,selectedId:null,brief:null,loading:false,error:null,undoStack:[],redoStack:[],
 setDesign:(d)=>set(s=>({...commit(s,d),selectedId:null})),
 patchElement:(id,patch)=>set(s=>{
   const next={...s.design,elements:s.design.elements.map(e=>e.id===id?({...e,...patch} as DesignElement):e)};
   return commit(s,next)
 }),
 addElement:(el)=>set(s=>({...commit(s,{...s.design,elements:[...s.design.elements,el]}),selectedId:el.id})),
 removeSelected:()=>set(s=>s.selectedId?({...commit(s,{...s.design,elements:s.design.elements.filter(e=>e.id!==s.selectedId)}),selectedId:null}):s),
 select:(id)=>set({selectedId:id}),
 undo:()=>set(s=>{if(!s.undoStack.length)return s;const previous=s.undoStack[s.undoStack.length-1];persist(previous);return{design:previous,undoStack:s.undoStack.slice(0,-1),redoStack:[...s.redoStack,s.design],selectedId:null}}),
 redo:()=>set(s=>{if(!s.redoStack.length)return s;const next=s.redoStack[s.redoStack.length-1];persist(next);return{design:next,redoStack:s.redoStack.slice(0,-1),undoStack:[...s.undoStack,s.design],selectedId:null}}),
 setBrief:(brief)=>set({brief}),setLoading:(loading)=>set({loading}),setError:(error)=>set({error}),
 reset:()=>{const d=structuredClone(qaHub);get().setDesign(d);set({brief:null,error:null})}
}));
