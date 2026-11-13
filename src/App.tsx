import {useEffect,useRef,useState,useMemo} from 'react';
import type {ReactNode} from 'react';
import {auth,type AuthSession} from './lib/auth';
import {ArrowDownToLine,ArrowRight,Check,ChevronDown,ChevronRight,Circle,CircleHelp,Download,FileImage,FileJson,ImagePlus,Layers,LayoutTemplate,Maximize2,Minus,MousePointer2,Plus,Redo2,RotateCcw,Send,Settings2,Shapes,Sparkles,Trash2,Type,Undo2,Upload,WandSparkles,X,Zap,PlugZap,Focus,UserRound} from 'lucide-react';
import type {DesignElement,CreativeBrief,GenerateRequest,Design} from './lib/schema';
import {designSchema,formats} from './lib/schema';
import {saveJSON,readDesign,readImage} from './lib/file';
import {qaHub,templateOptions} from './data/templates';
import {useStudio} from './store/useStudio';
import {CanvasEditor} from './components/CanvasEditor';
import {analyzeLayout} from './lib/designQuality';
import {auditProfessionalDesign} from './lib/proComposer';
import {apiUrl,isPagesWithoutApi,API_CHANGED_EVENT} from './lib/apiConnection';
import {ApiSettingsDialog} from './components/ApiSettingsDialog';
import {AuthDialog} from './components/AuthDialog';

const styles:[GenerateRequest['style'],string][]=[['studio','Studio'],['bold','Impactante'],['editorial','Editorial'],['minimal','Minimalista'],['playful','Criativo']];
const sizes:[GenerateRequest['format'],string][]=[['portrait','Instagram 4:5'],['square','Quadrado 1:1'],['story','Story 9:16'],['landscape','Paisagem 16:9'],['banner','Banner / OG']];
const defaultPrompt='Crie um post de divulgação para o QA Hub, uma plataforma que centraliza tarefas, gera casos de teste com IA, organiza evidências, diagramas e posts técnicos. Design elegante e contemporâneo, verde petróleo, alto contraste, foco em produtividade.';
const id=()=>`el-${Math.random().toString(36).slice(2,10)}`;
function Field({label,children}:{label:string,children:ReactNode}){return <label className="prop-field"><span>{label}</span>{children}</label>}
function PropertyInput({value,onChange,min,max,step=1}:{value:number,onChange:(v:number)=>void,min?:number,max?:number,step?:number}){
 const [draft,setDraft]=useState(String(value));
 useEffect(()=>{setDraft(String(value))},[value]);
 const commit=()=>{
   if(draft.trim()===''){setDraft(String(value));return}
   const number=Number(draft);
   if(!Number.isFinite(number)){setDraft(String(value));return}
   const clamped=Math.min(max??Infinity,Math.max(min??-Infinity,number));
   setDraft(String(clamped));
   if(clamped!==value)onChange(clamped);
 };
 return <input className="text-input" type="number" min={min} max={max} step={step} value={draft}
   onChange={e=>setDraft(e.target.value)} onBlur={commit}
   onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();if(e.key==='Escape'){setDraft(String(value));e.currentTarget.blur()}}}/>;
}
function Inspector(){
 const {design,selectedId,select,patchElement,addElement,removeSelected,setDesign}=useStudio();
 const imageInput=useRef<HTMLInputElement>(null);
 const selected=design.elements.find(x=>x.id===selectedId);
 function addShape(type:'text'|'rect'|'ellipse'|'polygon'|'star'|'line'){
  const common={id:id(),x:Math.round(design.canvas.width*.2),y:Math.round(design.canvas.height*.2),width:340,height:180,rotation:0,opacity:1};
  let el:DesignElement;
  switch(type){
   case 'text':el={...common,type,content:'Seu texto aqui',fontSize:60,fontWeight:'bold',color:'#FFFFFF',align:'left',fontFamily:'Inter'};break;
   case 'rect':el={...common,type,fill:'#36D6B0',radius:18,strokeWidth:0};break;
   case 'ellipse':el={...common,type,fill:'#36D6B0',strokeWidth:0};break;
   case 'polygon':el={...common,type,fill:'#36D6B0',sides:3,strokeWidth:0};break;
   case 'star':el={...common,type,fill:'#36D6B0',points:5,innerRatio:0.46,strokeWidth:0};break;
   case 'line':el={...common,type,fill:'#36D6B0',width:360,height:2,strokeWidth:6};break;
  }
  addElement(el);
 }
 async function addImage(f:File|undefined){if(!f)return;try{const src=await readImage(f);addElement({type:'image',id:id(),x:140,y:260,width:420,height:360,src,rotation:0,opacity:1})}catch(err){alert(err instanceof Error?err.message:'Imagem inválida')}}
 function update(patch:Partial<DesignElement>){if(selected)patchElement(selected.id,patch)}
 return <aside className="inspector">
  <div className="side-heading"><div><div className="micro-label">PROPRIEDADES</div><h3>Editor de elementos</h3></div><Settings2 size={18} color="#829095"/></div>
  <div className="inspector-section"><div className="section-header"><h4>Adicionar elementos</h4></div>
   <div className="tool-grid">
    <button className="tool-btn" onClick={()=>addShape('text')}><Type size={20}/><span>Texto</span></button>
    <button className="tool-btn" onClick={()=>addShape('rect')}><Shapes size={20}/><span>Forma</span></button>
    <button className="tool-btn" onClick={()=>addShape('ellipse')}><Circle size={20}/><span>Círculo</span></button>
    <button className="tool-btn" onClick={()=>addShape('polygon')}><Shapes size={20}/><span>Polígono</span></button>
    <button className="tool-btn" onClick={()=>addShape('star')}><Sparkles size={20}/><span>Estrela</span></button>
    <button className="tool-btn" onClick={()=>addShape('line')}><Minus size={20}/><span>Linha</span></button>
    <button className="tool-btn" onClick={()=>imageInput.current?.click()}><ImagePlus size={20}/><span>Imagem</span></button>
   </div><input ref={imageInput} type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={e=>{void addImage(e.target.files?.[0]);e.target.value=''}}/>
  </div>
  <div className="inspector-section layer-section">
   <div className="section-header"><h4><Layers size={15}/> Camadas</h4><span className="count">{design.elements.length}</span></div>
   <div className="layers-list">
   {[...design.elements].reverse().map((el)=> <button key={el.id} onClick={()=>select(el.id)} className={'layer-item '+(selectedId===el.id?'active':'')}>
     <span className="layer-icon">{el.type==='text'?<Type size={15}/>:el.type==='image'?<FileImage size={15}/>:<Shapes size={15}/>}</span>
     <span className="layer-text">{el.type==='text'?el.content.split('\n')[0]:el.type==='rect'?'Retângulo':el.type==='ellipse'?'Elipse':el.type==='polygon'?'Polígono':el.type==='star'?'Estrela':el.type==='line'?'Linha':'Imagem'}</span>
     {selectedId===el.id&&<span className="layer-active-dot"/>}
   </button>)}
   </div>
  </div>
  <div className="inspector-section properties-section">
   <div className="section-header"><h4>{selected?'Elemento selecionado':'Canvas'}</h4>{selected&&<button title="Excluir elemento" className="icon-danger" onClick={removeSelected}><Trash2 size={16}/></button>}</div>
   {selected ? <>
     <div className="field-grid"><Field label="X"><PropertyInput value={selected.x} onChange={v=>update({x:v})}/></Field><Field label="Y"><PropertyInput value={selected.y} onChange={v=>update({y:v})}/></Field><Field label="Largura"><PropertyInput value={selected.width} min={1} onChange={v=>update({width:v})}/></Field><Field label="Altura"><PropertyInput value={selected.height} min={1} onChange={v=>update({height:v})}/></Field></div>
     {selected.type==='text'&& <><Field label="Conteúdo"><textarea className="text-input edit-text" rows={3} value={selected.content} onChange={e=>update({content:e.target.value})}/></Field>
     <div className="field-grid"><Field label="Tamanho da fonte"><PropertyInput value={selected.fontSize} min={10} max={260} onChange={v=>update({fontSize:v})}/></Field><Field label="Peso"><select className="text-input" value={selected.fontWeight} onChange={e=>update({fontWeight:e.target.value as 'bold'|'normal'})}><option value="bold">Negrito</option><option value="normal">Normal</option></select></Field></div></>}
     {selected.type!=='image'&&<Field label={selected.type==='text'?'Cor do texto':'Cor do elemento'}><div className="color-field"><input type="color" value={selected.type==='text'?selected.color:selected.fill} onChange={e=>update(selected.type==='text'?{color:e.target.value}:{fill:e.target.value})}/><span>{selected.type==='text'?selected.color:selected.fill}</span></div></Field>}
     {selected.type==='rect'&&<Field label="Arredondamento"><PropertyInput value={selected.radius} min={0} max={300} onChange={v=>update({radius:v})}/></Field>}
     {selected.type==='polygon'&&<Field label="Número de lados"><PropertyInput value={selected.sides} min={3} max={12} onChange={v=>update({sides:Math.round(v)})}/></Field>}
     {selected.type==='star'&&<Field label="Número de pontas"><PropertyInput value={selected.points} min={4} max={12} onChange={v=>update({points:Math.round(v)})}/></Field>}
     {selected.type==='line'&&<Field label="Espessura da linha"><PropertyInput value={selected.strokeWidth} min={1} max={30} onChange={v=>update({strokeWidth:v})}/></Field>}
     <div className="field-grid"><Field label="Rotação"><PropertyInput value={selected.rotation} min={-360} max={360} onChange={v=>update({rotation:v})}/></Field><Field label="Opacidade"><PropertyInput value={selected.opacity} min={0} max={1} step={0.1} onChange={v=>update({opacity:v})}/></Field></div>
   </> : <>
     <div className="field-grid"><Field label="Largura"><span className="static-field">{design.canvas.width}px</span></Field><Field label="Altura"><span className="static-field">{design.canvas.height}px</span></Field></div>
     <Field label="Fundo inicial"><div className="color-field"><input type="color" value={design.canvas.background} onChange={e=>setDesign({...design,canvas:{...design.canvas,background:e.target.value}})}/><span>{design.canvas.background}</span></div></Field>
     <Field label="Fundo final"><div className="color-field"><input type="color" value={design.canvas.backgroundEnd||design.canvas.background} onChange={e=>setDesign({...design,canvas:{...design.canvas,backgroundEnd:e.target.value}})}/><span>{design.canvas.backgroundEnd||design.canvas.background}</span></div></Field>
     <div className="inspector-tip"><Sparkles size={16}/> Selecione um elemento no canvas para editar textos, cores, posições e dimensões.</div>
   </>}
  </div>
 </aside>;
}
function BriefBox({brief}:{brief:CreativeBrief}){const [open,setOpen]=useState(false);return <div className="brief-box"><button className="brief-title" onClick={()=>setOpen(v=>!v)}><span><Check size={14}/> Briefing da IA</span><ChevronDown size={14} className={open?'rotate':''}/></button>{open&&<div className="brief-body"><p><strong>Conceito:</strong> {brief.concept}</p><p><strong>Direção visual:</strong> {brief.visualDirection}</p><p><strong>Hierarquia:</strong> {brief.hierarchy}</p><p><strong>Tipografia:</strong> {brief.typography}</p><div className="swatches">{brief.palette.map(x=><span key={x} style={{background:x}} title={x}/>)}</div></div>}</div>}
function GeneratePanel({onConfigureApi,onSignIn,session}:{onConfigureApi:()=>void;onSignIn:()=>void;session:AuthSession|null}){
 const {setBrief,brief,setDesign,loading,setLoading,error,setError}=useStudio();
 const [prompt,setPrompt]=useState(defaultPrompt);
 const [style,setStyle]=useState<GenerateRequest['style']>('studio');
 const [format,setFormat]=useState<GenerateRequest['format']>('portrait');
 const [revision,setRevision]=useState('');
 const [showRevision,setShowRevision]=useState(false);
 const [connected,setConnected]=useState(false);
 const [selectedModel,setSelectedModel]=useState<string|null>(null);
 const [checkingModels,setCheckingModels]=useState(false);
 const [apiUnconfigured,setApiUnconfigured]=useState(isPagesWithoutApi);
 const [apiOffline,setApiOffline]=useState(false);
 const [enhancedPrompt,setEnhancedPrompt]=useState('');
 const [enhancing,setEnhancing]=useState(false);
 const [enhancedOpen,setEnhancedOpen]=useState(false);
 const [repairMessages,setRepairMessages]=useState<string[]>([]);
 async function checkModels(){
   setCheckingModels(true);
   if(isPagesWithoutApi()){setApiUnconfigured(true);setApiOffline(false);setConnected(false);setSelectedModel(null);setCheckingModels(false);return}
   setApiUnconfigured(false);
   try{
     const r=await fetch(apiUrl('models'));
     if(!r.ok)throw new Error('API indisponível');
     const status=await r.json() as {configured:boolean;requiresAuth?:boolean;selected:string|null};
     setConnected(Boolean(status.configured));setSelectedModel(status.selected);setApiOffline(false);
   }catch{setConnected(false);setApiOffline(true)}
   finally{setCheckingModels(false)}
 }
 useEffect(()=>{void checkModels();const listener=()=>{void checkModels()};window.addEventListener(API_CHANGED_EVENT,listener);return()=>window.removeEventListener(API_CHANGED_EVENT,listener)},[]);
 useEffect(()=>{setEnhancedPrompt('');setEnhancedOpen(false)},[prompt,style,format]);
 async function enhance(){
   if(!session){onSignIn();return}
   if(apiUnconfigured){setError('Backend HTTPS não está conectado.');return}
   if(prompt.trim().length<2){setError('Descreva brevemente o conteúdo desejado.');return}
   setEnhancing(true);setError(null);
   try{
     const token=await auth.getToken();
     if(!token){onSignIn();return}
     const response=await fetch(apiUrl('enhance'),{
       method:'POST',
       headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
       body:JSON.stringify({prompt,style,format}),
     });
     const result=await response.json() as {enhancedPrompt?:string;brief?:CreativeBrief;model?:string;error?:string};
     if(!response.ok||!result.enhancedPrompt)throw new Error(result.error||'Falha ao aprimorar o prompt.');
     setEnhancedPrompt(result.enhancedPrompt);
     setEnhancedOpen(true);
     if(result.brief)setBrief(result.brief);
     if(result.model)setSelectedModel(result.model);
   }catch(e){setError(e instanceof Error?e.message:'Não foi possível detalhar o prompt.')}
   finally{setEnhancing(false)}
 }
 async function generate(useRevision=false){
   if(apiUnconfigured){setError('Conecte um backend HTTPS para usar a geração NVIDIA no GitHub Pages.');return}
   if(!session){onSignIn();return}
   if(prompt.trim().length<2){setError('Escreva pelo menos uma palavra sobre a arte desejada.');return}
   setLoading(true);setError(null);setRepairMessages([]);
   try{
     const token=await auth.getToken();
     if(!token){onSignIn();return}
     const request={prompt,style,format,...(enhancedPrompt?{enhancedPrompt}:{}),...(useRevision?{instruction:revision}:{} )};
     const r=await fetch(apiUrl('generate'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(request)});
     const response=await r.json() as {brief?:CreativeBrief,design?:Design,error?:string,model?:string,repairs?:string[],enhancedPrompt?:string};
     if(!r.ok||!response.brief||!response.design)throw new Error(response.error||`HTTP ${r.status}: erro na geração`);
     const validated=designSchema.parse(response.design);setBrief(response.brief);setDesign(validated);
     if(response.model)setSelectedModel(response.model);
     if(!enhancedPrompt&&response.enhancedPrompt){setEnhancedPrompt(response.enhancedPrompt);setEnhancedOpen(true)}
     setRepairMessages(Array.isArray(response.repairs)?response.repairs:[]);
     setShowRevision(false);setRevision('');
   }catch(e){setError(e instanceof Error?e.message:'Falha na geração')}
   finally{setLoading(false)}
 }
 return <aside className="generate-panel">
   <div className="side-heading"><div><div className="micro-label">CRIAR COM IA</div><h3>Da ideia à imagem.</h3></div><div className="side-heading-icon"><Sparkles size={18}/></div></div>
   <div className="prompt-content"><label className="input-label" htmlFor="prompt">O que vamos criar?</label>
    <div className="prompt-box"><textarea id="prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ex.: Crie um post de divulgação para minha marca..." rows={8} maxLength={3000}/><div className="prompt-foot"><span><WandSparkles size={14}/> Linguagem natural</span><span>{prompt.length}/3000</span></div></div>
    <div className="fc-idea-heading">Experimente um ponto de partida</div><div className="fc-prompt-ideas"><button type="button" onClick={()=>setPrompt('Crie um post profissional para Instagram divulgando o QA Hub. Destaque geração de casos de teste com IA, produtividade e um fluxo organizado. Layout editorial com tipografia forte, cores verde-petróleo e detalhes menta.')}>Post de produto</button><button type="button" onClick={()=>setPrompt('Crie um banner de lançamento para uma plataforma tecnológica chamada QA Hub. Direção visual minimalista, hierarquia clara, mensagem curta e chamada para conhecer a ferramenta.')}>Banner de lançamento</button><button type="button" onClick={()=>setPrompt('Crie uma capa para apresentação de software QA. Visual contemporâneo, título grande, composição geométrica precisa e contraste profissional.')}>Capa de apresentação</button></div>
    <div className="side-subheading">Estilo visual</div><div className="style-chips">{styles.map(([v,label])=><button key={v} onClick={()=>setStyle(v)} className={'style-chip '+(style===v?'selected':'')}>{style===v&&<Check size={12}/>} {label}</button>)}</div>
    <div className="side-subheading">Dimensão da arte</div><div className="select-wrap"><Maximize2 size={17}/><select value={format} onChange={e=>setFormat(e.target.value as GenerateRequest['format'])}>{sizes.map(([value,label])=><option value={value} key={value}>{label}  ·  {formats[value].width}×{formats[value].height}</option>)}</select><ChevronDown size={16}/></div>
    <button type="button" className="fc-enhance-btn" disabled={loading||enhancing} onClick={()=>void enhance()}>{enhancing?<><span className="spinner"/> Detalhando a direção de arte...</>:<><WandSparkles size={17}/> Aprimorar meu prompt com IA <ArrowRight size={16}/></>}</button>
    {enhancedPrompt&&<div className="fc-enhanced-panel"><button className="fc-enhanced-header" type="button" aria-expanded={enhancedOpen} onClick={()=>setEnhancedOpen(v=>!v)}><span><Sparkles size={15}/> Prompt profissional gerado</span><ChevronDown size={15} className={enhancedOpen?'rotate':''}/></button>
     {enhancedOpen&&<><p>Revise ou edite a direção de arte detalhada antes de gerar a imagem.</p><textarea value={enhancedPrompt} onChange={e=>setEnhancedPrompt(e.target.value)} rows={11} maxLength={8500} aria-label="Prompt aprimorado pela NVIDIA"/><div className="fc-enhanced-foot"><span>{enhancedPrompt.length} caracteres</span><button type="button" onClick={()=>void navigator.clipboard.writeText(enhancedPrompt)}>Copiar prompt</button></div></>}
    </div>}
    <button className="generate-btn" disabled={loading||enhancing} onClick={()=>void generate()}>{loading?<><span className="spinner"/> Criando design...</>:<><Sparkles size={18}/> Gerar minha imagem <ArrowRight size={17}/></>}</button>
    {loading&&<p className="busy-caption">Aplicando a direção de arte e preparando o JSON editável.</p>}
    {error&&<div className="error-box" role="alert"><CircleHelp size={17}/><span>{error}</span><button type="button" aria-label="Fechar erro" onClick={()=>setError(null)}><X size={16}/></button></div>}
    {repairMessages.length>0&&<details className="repair-notice"><summary><Check size={15}/> Design gerado com {repairMessages.length} ajuste(s) automático(s)</summary><ul>{repairMessages.slice(0,12).map((item,i)=><li key={i}>{item}</li>)}</ul></details>}
    <div className={'connected-info fc-connection '+(connected?'fc-online':'fc-offline')}>
      <div className="connection-title"><span className={'status-dot '+(connected?'on':'')}/><strong>{connected?(session?'Pronto para gerar':'IA pronta • entre com e-mail'):apiUnconfigured?'Conecte sua API NVIDIA':apiOffline?'Servidor indisponível':'NVIDIA não configurada'}</strong><button type="button" disabled={checkingModels} title="Verificar conexão NVIDIA" aria-label="Verificar conexão NVIDIA" onClick={()=>void checkModels()}><RotateCcw size={14} className={checkingModels?'spin-icon':''}/></button></div>
      <span className="subtle-micro" title={selectedModel??'Seleção automática'}>{connected?(session?(selectedModel?'Modelo: '+selectedModel.split('/').at(-1):'Sua sessão Supabase está ativa'):'Entre com um link enviado por e-mail.'):apiUnconfigured?'No Pages, configure uma API HTTPS externa.':apiOffline?'Confira o endereço da API ou inicie o backend.':'Configure NVIDIA_API_KEY no backend.'}</span>
      <button type="button" className="fc-connect-btn" onClick={session?onConfigureApi:onSignIn}><PlugZap size={14}/> {session?'Detalhes da conexão':'Entrar com e-mail'}</button>
    </div>
    {brief&&<BriefBox brief={brief}/>}
    <button className="revision-toggle" onClick={()=>setShowRevision(v=>!v)}><RotateCcw size={16}/> Refinar por comando <ChevronRight size={15} className={showRevision?'rotate90':''}/></button>
    {showRevision&&<div className="revision-box"><textarea rows={3} value={revision} onChange={e=>setRevision(e.target.value)} placeholder="Ex.: destaque mais o título e diminua os cartões"/><button disabled={loading||revision.trim().length<4} onClick={()=>void generate(true)}><Send size={15}/> Aplicar ajuste com IA</button></div>}
   </div>
   <div className="sidebar-bottom"><div className="bottom-kicker"><Zap size={16}/> COMO FUNCIONA</div><div className="pipeline-step"><span>01</span> Descrição em linguagem livre <Check size={14}/></div><div className="pipeline-step"><span>02</span> NVIDIA detalha o prompt <Check size={14}/></div><div className="pipeline-step"><span>03</span> JSON, edição e exportação <Check size={14}/></div></div>
 </aside>
}
function HelpDialog({close}:{close:()=>void}){return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-top"><h3>Como usar o AI Image Studio</h3><button onClick={close}><X size={20}/></button></div><p>Escreva livremente o que pretende criar, escolha o estilo e o formato e clique em <strong>Aprimorar meu prompt com IA</strong>. A NVIDIA transforma sua descrição em uma direção de arte detalhada, que você pode editar antes de clicar em <strong>Gerar minha imagem</strong>.</p><p>Para usar a IA no site público, entre por um link enviado ao seu e-mail. Nenhum token privado precisa ser informado.</p><p>Selecione os elementos para arrastar, redimensionar, girar e alterar as propriedades. Você também pode importar JSON, inserir imagens do computador e exportar PNG, WebP e JSON.</p><p>O editor de composição não produz fotografias por si só. Para gerar imagens fotográficas ou ilustrações, utilize um motor generativo separado (por exemplo, ComfyUI), depois importe o arquivo como camada.</p><div className="modal-links"><a href="https://build.nvidia.com/" target="_blank" rel="noreferrer">Obter chave NVIDIA <ArrowRight size={15}/></a><a href="https://github.com/Comfy-Org/ComfyUI" target="_blank" rel="noreferrer">ComfyUI <ArrowRight size={15}/></a></div><button className="generate-btn" onClick={close}>Entendi</button></div></div>}
function App(){
 const {design,setDesign,undo,redo,undoStack,redoStack,loading,reset}=useStudio();
 const layoutIssues=useMemo(()=>[...new Set([...analyzeLayout(design),...auditProfessionalDesign(design)])],[design]);
 const [zoom,setZoom]=useState(100);const [exportOpen,setExportOpen]=useState(false);const [help,setHelp]=useState(false);const [apiSettingsOpen,setApiSettingsOpen]=useState(false);const [authOpen,setAuthOpen]=useState(false);const [session,setSession]=useState<AuthSession|null>(null);const [focusMode,setFocusMode]=useState(false);const [templatesExpanded,setTemplatesExpanded]=useState(false);const [mobilePanel,setMobilePanel]=useState<'prompt'|'layers'>('prompt');
 useEffect(()=>{let active=true;void auth.init().then(s=>{if(active)setSession(s)});const unsubscribe=auth.subscribe(s=>{if(active){setSession(s);if(s)setAuthOpen(false)}});return()=>{active=false;unsubscribe()}},[]);
 const exportRef=useRef<((mime?:'image/png'|'image/webp')=>void)|null>(null);
 const fileRef=useRef<HTMLInputElement>(null);
 const exportMenu=useRef<HTMLDivElement>(null);
 useEffect(()=>{const fn=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey){if(!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement)){e.preventDefault();undo()}}if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();redo()}};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[undo,redo]);
 async function openFile(f:File|undefined){if(!f)return;try{setDesign(await readDesign(f))}catch(e){alert(e instanceof Error?e.message:'Arquivo inválido')}}
 return <div className={'app-shell '+(focusMode?'focus-mode':'')}>
  <header className="topbar"><div className="brand"><div className="brand-icon"><Shapes size={22} strokeWidth={2.4}/></div><div className="brand-title">frame<span>craft</span><small>AI IMAGE STUDIO</small></div></div><span className="bar-divider"/><div className="header-subnav"><button className="nav-active"><MousePointer2 size={15}/> Estúdio</button><button onClick={()=>setHelp(true)}><CircleHelp size={15}/> Como usar</button></div><div className="header-actions"><button className="ghost-btn fc-focus-action" title={focusMode?'Exibir painéis':'Ampliar área de criação'} aria-label={focusMode?'Exibir painéis':'Ampliar área de criação'} onClick={()=>setFocusMode(v=>!v)}><Focus size={16}/><span>{focusMode?'Mostrar painéis':'Foco'}</span></button><button className="ghost-btn fc-connection-action" title="Configurar conexão NVIDIA" onClick={()=>setApiSettingsOpen(true)}><PlugZap size={16}/><span>Conexão</span></button><button className="ghost-btn fc-auth-action" title={session?'Conta conectada':'Entrar com e-mail'} onClick={()=>setAuthOpen(true)}><UserRound size={16}/><span>{session?'Minha conta':'Entrar'}</span></button><div className="header-pill"><span className="status-dot on"/> Editor JSON</div><button className="ghost-btn import-btn" onClick={()=>fileRef.current?.click()}><Upload size={16}/> Importar</button><input ref={fileRef} className="hidden" type="file" accept="application/json,.json" onChange={e=>{void openFile(e.target.files?.[0]);e.target.value=''}}/><div className="export-wrapper" ref={exportMenu}><button className="top-export-btn" aria-expanded={exportOpen} aria-haspopup="menu" onClick={()=>setExportOpen(x=>!x)}><Download size={16}/> Exportar <ChevronDown size={15}/></button>{exportOpen&&<div className="export-menu" role="menu"><button onClick={()=>{exportRef.current?.('image/png');setExportOpen(false)}}><FileImage size={16}/> PNG <span>Alta resolução</span></button><button onClick={()=>{exportRef.current?.('image/webp');setExportOpen(false)}}><FileImage size={16}/> WebP <span>Compacto</span></button><button onClick={()=>{saveJSON(design);setExportOpen(false)}}><FileJson size={16}/> JSON <span>Editável</span></button></div>}</div></div></header>
  <div className="mobile-tabs"><button className={mobilePanel==='prompt'?'active':''} onClick={()=>setMobilePanel('prompt')}><Sparkles size={16}/> Criar com IA</button><button className={mobilePanel==='layers'?'active':''} onClick={()=>setMobilePanel('layers')}><Layers size={16}/> Propriedades</button></div>
  <div className={'workspace mobile-'+mobilePanel}>
   <GeneratePanel onConfigureApi={()=>setApiSettingsOpen(true)} onSignIn={()=>setAuthOpen(true)} session={session}/>
   <main className="main-panel"><div className="main-header"><div><div className="breadcrumb">WORKSPACE <ChevronRight size={13}/> <span>COMPOSIÇÃO ATUAL</span></div><div className="main-heading"><h1>{design.title}</h1><span className="saved-chip"><Check size={12}/> Edição local</span></div></div><button className="square-btn" title="Restaurar o template inicial" onClick={()=>{if(confirm('Restaurar o exemplo do QA Hub? Suas alterações atuais serão substituídas.'))reset()}}><RotateCcw size={18}/></button></div>
    <div className="canvas-toolbar"><div className="toolbar-left"><span className="toolbar-label"><MousePointer2 size={15}/> Seleção</span><span className="toolbar-split"/><button title="Desfazer" disabled={!undoStack.length} onClick={undo}><Undo2 size={17}/></button><button title="Refazer" disabled={!redoStack.length} onClick={redo}><Redo2 size={17}/></button><span className="toolbar-split"/><span className="toolbar-state"><span className="little-green"/> Canvas editável</span></div><div className="toolbar-right"><button title="Reduzir zoom" onClick={()=>setZoom(z=>Math.max(60,z-10))}><Minus size={17}/></button><span className="zoom-value">{zoom}%</span><button title="Ampliar zoom" onClick={()=>setZoom(z=>Math.min(160,z+10))}><Plus size={17}/></button><button title="Ajustar ao painel" onClick={()=>setZoom(100)}><Maximize2 size={17}/></button><span className="toolbar-split"/><button title="Exportar PNG" onClick={()=>exportRef.current?.('image/png')}><ArrowDownToLine size={17}/></button></div></div>
    <CanvasEditor exportRef={exportRef} zoom={zoom}/>
    <div className="layout-quality" role="status"><span className={layoutIssues.length?'quality-attention':'quality-ok'}>{layoutIssues.length?`${layoutIssues.length} ponto(s) para revisar`:'Composição dentro dos limites'}</span>{layoutIssues.length>0&&<details><summary>Verificar layout</summary><ul>{layoutIssues.slice(0,5).map((issue,i)=><li key={i}>{issue}</li>)}</ul></details>}</div>
    <div className={'templates-strip '+(!templatesExpanded?'fc-templates-compact':'')}><div className="templates-intro"><LayoutTemplate size={18}/><div><strong>Modelos de composição</strong><span>Comece com um layout pronto</span></div><button type="button" className="fc-templates-toggle" aria-expanded={templatesExpanded} onClick={()=>setTemplatesExpanded(v=>!v)}>{templatesExpanded?'Recolher':'Explorar modelos'} <ChevronDown size={15} className={templatesExpanded?'rotate':''}/></button></div>{templatesExpanded&&<div className="template-cards">{templateOptions.map(opt=><button key={opt.id} className="template-card" onClick={()=>{if(confirm('Substituir a composição atual por este template?'))setDesign(structuredClone(opt.doc))}}><span className={'template-swatch '+(opt.id==='qa'?'qa-swatch':'editorial-swatch')}>{opt.id==='qa'?'QA':'Aa'}</span><span>{opt.label}</span><ArrowRight size={14}/></button>)}<button className="template-card blank" onClick={()=>setDesign({...structuredClone(qaHub),title:'Nova composição',elements:[],canvas:{...qaHub.canvas,background:'#ffffff',backgroundEnd:undefined}})}><span className="template-add"><Plus size={18}/></span><span>Em branco</span></button></div>}</div>
   </main>
   <Inspector/>
  </div>
  <footer className="footer-status"><span><span className="status-dot on"/> FrameCraft <span className="muted">· Composições em JSON</span></span><span>Edição e exportação locais · Geração com IA requer backend conectado</span></footer>
  {help&&<HelpDialog close={()=>setHelp(false)}/>} 
  {apiSettingsOpen&&<ApiSettingsDialog onClose={()=>setApiSettingsOpen(false)}/>} 
  <AuthDialog open={authOpen} onClose={()=>setAuthOpen(false)} signedEmail={session?.user.email}/>
  {loading&&<div className="generation-toast"><span className="spinner"/> A NVIDIA está compondo sua imagem... <span className="muted">Não feche a página.</span></div>}
 </div>;
}
export default App;
