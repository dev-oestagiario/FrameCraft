import {useEffect,useRef,useState,useMemo} from 'react';
import type {ReactNode} from 'react';
import {auth,type AuthSession} from './lib/auth';
import {ArrowRight,Check,ChevronDown,ChevronRight,Circle,CircleHelp,Download,FileImage,FileJson,ImagePlus,Layers,LayoutTemplate,Maximize2,Minus,Plus,Redo2,RotateCcw,Send,Settings2,Shapes,Sparkles,Trash2,Type,Undo2,Upload,WandSparkles,X,Focus,UserRound,Sun,Moon,Ellipsis,PanelRightClose,PanelRightOpen} from 'lucide-react';
import type {DesignElement,CreativeBrief,GenerateRequest,Design} from './lib/schema';
import {designSchema} from './lib/schema';
import {saveJSON,readDesign,readImage} from './lib/file';
import {qaHub,templateOptions} from './data/templates';
import {useStudio} from './store/useStudio';
import {CanvasEditor} from './components/CanvasEditor';
import {analyzeLayout} from './lib/designQuality';
import {auditProfessionalDesign} from './lib/proComposer';
import {composePremiumCampaign} from './lib/premiumCampaign';
import {apiUrl,isPagesWithoutApi,API_CHANGED_EVENT} from './lib/apiConnection';
import {ApiSettingsDialog} from './components/ApiSettingsDialog';
import {AuthDialog} from './components/AuthDialog';

const styles:[GenerateRequest['style'],string][]=[['studio','Profissional'],['bold','Impactante'],['editorial','Editorial'],['minimal','Minimalista'],['playful','Criativo']];
const sizes:[GenerateRequest['format'],string][]=[['portrait','Instagram 4:5'],['square','Quadrado 1:1'],['story','Story 9:16'],['landscape','Paisagem 16:9'],['banner','Banner / OG']];
const defaultPrompt='';
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
function Inspector({onClose}:{onClose:()=>void}){
 const {design,selectedId,select,patchElement,addElement,removeSelected,setDesign}=useStudio();
 const [showTools,setShowTools]=useState(false);
 const [showLayers,setShowLayers]=useState(false);
 const imageInput=useRef<HTMLInputElement>(null);
 const selected=design.elements.find(x=>x.id===selectedId);
 function addShape(type:'text'|'rect'|'ellipse'|'polygon'|'star'|'line'){
  const common={id:id(),x:Math.round(design.canvas.width*.2),y:Math.round(design.canvas.height*.2),width:340,height:180,rotation:0,opacity:1};
  let el:DesignElement;
  switch(type){
   case 'text':el={...common,type,content:'Seu texto aqui',fontSize:60,fontWeight:'bold',color:'#FFFFFF',align:'left',fontFamily:'Inter'};break;
   case 'rect':el={...common,type,fill:'#64748B',radius:18,strokeWidth:0};break;
   case 'ellipse':el={...common,type,fill:'#64748B',strokeWidth:0};break;
   case 'polygon':el={...common,type,fill:'#64748B',sides:3,strokeWidth:0};break;
   case 'star':el={...common,type,fill:'#64748B',points:5,innerRatio:0.46,strokeWidth:0};break;
   case 'line':el={...common,type,fill:'#64748B',width:360,height:2,strokeWidth:6};break;
  }
  addElement(el);
 }
 async function addImage(f:File|undefined){if(!f)return;try{const src=await readImage(f);addElement({type:'image',id:id(),x:140,y:260,width:420,height:360,src,fit:'cover',rotation:0,opacity:1})}catch(err){alert(err instanceof Error?err.message:'Imagem inválida')}}
 function update(patch:Partial<DesignElement>){if(selected)patchElement(selected.id,patch)}
 return <aside className="inspector">
  <div className="side-heading"><div><h3>Editar design</h3></div><button type="button" className="fc-icon-button" title="Fechar painel" aria-label="Fechar editor de elementos" onClick={onClose}><X size={17}/></button></div>
  <div className="inspector-section fc-collapsible"><button type="button" className="fc-section-toggle" aria-expanded={showTools} onClick={()=>setShowTools(v=>!v)}><span><Plus size={16}/> Adicionar elemento</span><ChevronDown size={16} className={showTools?'rotate':''}/></button>
   {showTools&&<div className="tool-grid">
    <button className="tool-btn" onClick={()=>addShape('text')}><Type size={20}/><span>Texto</span></button>
    <button className="tool-btn" onClick={()=>addShape('rect')}><Shapes size={20}/><span>Forma</span></button>
    <button className="tool-btn" onClick={()=>addShape('ellipse')}><Circle size={20}/><span>Círculo</span></button>
    <button className="tool-btn" onClick={()=>addShape('polygon')}><Shapes size={20}/><span>Polígono</span></button>
    <button className="tool-btn" onClick={()=>addShape('star')}><Sparkles size={20}/><span>Estrela</span></button>
    <button className="tool-btn" onClick={()=>addShape('line')}><Minus size={20}/><span>Linha</span></button>
    <button className="tool-btn" onClick={()=>imageInput.current?.click()}><ImagePlus size={20}/><span>Imagem</span></button>
   </div>}<input ref={imageInput} type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={e=>{void addImage(e.target.files?.[0]);e.target.value=''}}/>
  </div>
  <div className="inspector-section layer-section fc-collapsible">
   <button type="button" className="fc-section-toggle" aria-expanded={showLayers} onClick={()=>setShowLayers(v=>!v)}><span><Layers size={16}/> Camadas <small>{design.elements.length}</small></span><ChevronDown size={16} className={showLayers?'rotate':''}/></button>
   {showLayers&&<div className="layers-list">
   {[...design.elements].reverse().map((el)=> <button key={el.id} onClick={()=>select(el.id)} className={'layer-item '+(selectedId===el.id?'active':'')}>
     <span className="layer-icon">{el.type==='text'?<Type size={15}/>:el.type==='image'?<FileImage size={15}/>:<Shapes size={15}/>}</span>
     <span className="layer-text">{el.type==='text'?el.content.split('\n')[0]:el.type==='rect'?'Retângulo':el.type==='ellipse'?'Elipse':el.type==='polygon'?'Polígono':el.type==='star'?'Estrela':el.type==='line'?'Linha':'Imagem'}</span>
     {selectedId===el.id&&<span className="layer-active-dot"/>}
   </button>)}
   </div>}
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
 const [originalPrompt,setOriginalPrompt]=useState('');
 const [style,setStyle]=useState<GenerateRequest['style']>('studio');
 const [format,setFormat]=useState<GenerateRequest['format']>('portrait');
 const [renderMode,setRenderMode]=useState<'visual'|'vector'>('visual');
 const [uploadedHero,setUploadedHero]=useState<string|null>(null);
 const [visualBlocked,setVisualBlocked]=useState(false);
 const [visualCode,setVisualCode]=useState('');
 const heroFileInput=useRef<HTMLInputElement>(null);
 const [revision,setRevision]=useState('');
 const [showRevision,setShowRevision]=useState(false);
 const [connected,setConnected]=useState(false);
 const [apiUnconfigured,setApiUnconfigured]=useState(isPagesWithoutApi);
 const [apiOffline,setApiOffline]=useState(false);
 const [enhancing,setEnhancing]=useState(false);
 const [repairMessages,setRepairMessages]=useState<string[]>([]);
 async function checkModels(){
   if(isPagesWithoutApi()){setApiUnconfigured(true);setApiOffline(false);setConnected(false);return}
   setApiUnconfigured(false);
   try{
     const r=await fetch(apiUrl('models'));
     if(!r.ok)throw new Error('API indisponível');
     const status=await r.json() as {configured:boolean;requiresAuth?:boolean;selected:string|null};
     setConnected(Boolean(status.configured));setApiOffline(false);
   }catch{setConnected(false);setApiOffline(true)}
 }
 useEffect(()=>{void checkModels();const listener=()=>{void checkModels()};window.addEventListener(API_CHANGED_EVENT,listener);return()=>window.removeEventListener(API_CHANGED_EVENT,listener)},[]);

 async function selectHero(file:File|undefined){
   if(!file)return;
   try{const src=await readImage(file);setUploadedHero(src);setError(null);setVisualCode('')}
   catch(error){setError(error instanceof Error?error.message:'Não foi possível abrir a imagem.')}
 }
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
       body:JSON.stringify({prompt,originalPrompt:originalPrompt||prompt.slice(0,3000),style,format}),
     });
     const result=await response.json() as {enhancedPrompt?:string;brief?:CreativeBrief;model?:string;error?:string};
     if(!response.ok||!result.enhancedPrompt)throw new Error(result.error||'Falha ao aprimorar o prompt.');
     // Rewrite the main prompt in place; preserve the original subject separately.
     setOriginalPrompt(previous=>previous||prompt.slice(0,3000));
     setPrompt(result.enhancedPrompt.slice(0,8500));
     if(result.brief)setBrief(result.brief);
   }catch(e){setError(e instanceof Error?e.message:'Não foi possível detalhar o prompt.')}
   finally{setEnhancing(false)}
 }
 async function generate(useRevision=false){
   if(apiUnconfigured){setError('Conecte um backend HTTPS para usar a geração NVIDIA no GitHub Pages.');return}
   if(!session){onSignIn();return}
   if(prompt.trim().length<2){setError('Escreva pelo menos uma palavra sobre a arte desejada.');return}
   if(renderMode==='visual'&&!uploadedHero&&visualBlocked){setError('A geração visual foi bloqueada após falha do provedor. Envie uma foto, use o modo vetorial ou escolha Tentar novamente.');return}
   setLoading(true);setError(null);setRepairMessages([]);
   try{
     const token=await auth.getToken();
     if(!token){onSignIn();return}
     const request={prompt,originalPrompt:originalPrompt||undefined,style,format,
       ...(useRevision?{instruction:revision}:{} )};
     // The visual provider creates actual image pixels. The vector engine is
     // still available explicitly; never silently replace a failed hero with shapes.
     const endpoint=renderMode==='visual'&&!uploadedHero?'generate-visual':'generate';
     const r=await fetch(apiUrl(endpoint),{method:'POST',
       headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
       body:JSON.stringify(request)});
     const response=await r.json() as {brief?:CreativeBrief,design?:Design,
       hero?:{src?:string;model?:string},error?:string,code?:string,model?:string,repairs?:string[],attempts?:string[]};
     if(!r.ok){
       setVisualCode(response.code||'');
       if(endpoint==='generate-visual'&&['VISUAL_UNAUTHORIZED','VISUAL_FORBIDDEN','VISUAL_NOT_FOUND'].includes(response.code||''))setVisualBlocked(true);
       throw new Error(response.error||`HTTP ${r.status}: erro na geração`);
     }
     if(!response.brief)throw new Error('O backend não retornou um briefing válido.');
     const source=originalPrompt||prompt;
     let result:Design;
     if(renderMode==='visual'){
       const hero=uploadedHero||response.hero?.src;
       if(!hero)throw new Error('Nenhuma imagem foi retornada. Envie uma foto ou selecione o modo vetorial.');
       result=composePremiumCampaign(response.brief,source,format,style,hero,
         uploadedHero?'uploaded':'generated');
     }else{
       if(!response.design)throw new Error('O motor vetorial não retornou o documento JSON.');
       result=designSchema.parse(response.design);
     }
     const validated=designSchema.parse(result);
     setBrief(response.brief);setDesign(validated);setVisualBlocked(false);setVisualCode('');
     setRepairMessages(Array.isArray(response.repairs)?response.repairs:[]);
     setShowRevision(false);setRevision('');
   }catch(e){setError(e instanceof Error?(e instanceof TypeError?'Não foi possível conectar ao backend Supabase. Verifique a rede e a conexão HTTPS.':e.message):'Falha na geração')}
   finally{setLoading(false)}
 }
 return <aside className="generate-panel">
   <div className="side-heading"><div><h3>Criar imagem</h3><p className="fc-side-description">Descreva o que você tem em mente.</p></div></div>
   <div className="prompt-content"><label className="input-label" htmlFor="prompt">Sua ideia</label>
    <div className="prompt-box"><textarea id="prompt" value={prompt} onChange={e=>{setPrompt(e.target.value);if(!originalPrompt)setOriginalPrompt('')}} placeholder="Ex.: Um post para divulgar minha plataforma de testes, com um estilo elegante e moderno..." rows={6} maxLength={8500}/><div className="prompt-foot"><span><WandSparkles size={14}/> Linguagem natural</span><span>{prompt.length}/8500</span></div></div>
    <div className="fc-options">
     <label className="fc-option"><span>Estilo</span><div className="select-wrap"><select aria-label="Estilo visual" value={style} onChange={e=>setStyle(e.target.value as GenerateRequest['style'])}>{styles.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><ChevronDown size={15}/></div></label>
     <label className="fc-option"><span>Formato</span><div className="select-wrap"><select aria-label="Formato da imagem" value={format} onChange={e=>setFormat(e.target.value as GenerateRequest['format'])}>{sizes.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><ChevronDown size={15}/></div></label>
    </div>
    <div className="fc-render-controls">
      <label className="fc-option"><span>Tipo de criação</span>
        <div className="select-wrap"><select aria-label="Tipo de criação" value={renderMode}
          onChange={e=>setRenderMode(e.target.value as 'visual'|'vector')}>
          <option value="visual" disabled={visualBlocked&&!uploadedHero}>Imagem profissional (IA){visualBlocked&&!uploadedHero?' — indisponível':''}</option>
          <option value="vector">Somente vetor editável</option>
        </select><ChevronDown size={15}/></div>
      </label>
      {renderMode==='visual'&&<div className="fc-hero-upload">
        <input ref={heroFileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={e=>{void selectHero(e.target.files?.[0]);e.target.value=''}}/>
        <button className="fc-hero-pick" type="button" onClick={()=>heroFileInput.current?.click()}>
          <ImagePlus size={16}/>{uploadedHero?'Trocar foto do produto':'Usar minha foto (opcional)'}
        </button>
        {uploadedHero&&<div className="fc-hero-preview">
          <img src={uploadedHero} alt="Imagem selecionada para a campanha"/>
          <button type="button" onClick={()=>setUploadedHero(null)} aria-label="Remover imagem"><X size={15}/></button>
        </div>}
        <p>{uploadedHero?'A foto enviada será o elemento visual central. Textos continuam editáveis.':
          'A NVIDIA cria o visual do produto; o editor monta títulos e chamada em camadas separadas.'}</p>
      </div>}
    </div>
    <button type="button" className="fc-enhance-btn" disabled={loading||enhancing} onClick={()=>void enhance()}>{enhancing?<><span className="spinner"/> Detalhando a direção de arte...</>:<><WandSparkles size={17}/> Aprimorar meu prompt com IA <ArrowRight size={16}/></>}</button>
    <button className="generate-btn" disabled={loading||enhancing} onClick={()=>void generate()}>{loading?<><span className="spinner"/> Criando a campanha...</>:<><Sparkles size={18}/> Gerar minha imagem <ArrowRight size={17}/></>}</button>
    {loading&&<p className="busy-caption">{renderMode==='visual'?'Gerando a imagem do produto e montando a campanha editável.':'Gerando a composição vetorial editável.'}</p>}
    {error&&<div className="error-box" role="alert"><CircleHelp size={17}/><span>{error}</span><button type="button" aria-label="Fechar erro" onClick={()=>setError(null)}><X size={16}/></button></div>}
    {visualCode&&<div className="fc-visual-recovery" role="status">
      <span>O gerador visual não conseguiu concluir. Você pode usar uma foto, continuar com vetor ou testar novamente.</span>
      <div className="fc-recovery-actions">
        <button type="button" onClick={()=>heroFileInput.current?.click()}><ImagePlus size={14}/> Enviar foto</button>
        <button type="button" onClick={()=>{setRenderMode('vector');setError(null);setVisualCode('')}}>Usar vetor</button>
        <button type="button" onClick={()=>{setVisualBlocked(false);setVisualCode('');setError(null);setRenderMode('visual')}}>Tentar novamente</button>
      </div>
    </div>}
    {repairMessages.length>0&&<details className="repair-notice"><summary><Check size={15}/> Design gerado com {repairMessages.length} ajuste(s) automático(s)</summary><ul>{repairMessages.slice(0,12).map((item,i)=><li key={i}>{item}</li>)}</ul></details>}
    {!connected&&<div className="fc-inline-alert" role="status"><CircleHelp size={15}/><span>{apiOffline?'O servidor de IA está indisponível.':apiUnconfigured?'Conecte o backend para gerar imagens.':'A NVIDIA não está configurada.'}</span><button type="button" onClick={onConfigureApi}>Configurar</button></div>}
    {(brief||session)&&<details className="fc-extra-settings"><summary>Ajustes avançados <ChevronDown size={14}/></summary>
      {brief&&<BriefBox brief={brief}/>}
      <button className="revision-toggle" onClick={()=>setShowRevision(v=>!v)}><RotateCcw size={15}/> Ajustar com IA <ChevronRight size={14} className={showRevision?'rotate90':''}/></button>
      {showRevision&&<div className="revision-box"><textarea rows={3} value={revision} onChange={e=>setRevision(e.target.value)} placeholder="Ex.: aumente o título e use menos elementos"/><button disabled={loading||revision.trim().length<4} onClick={()=>void generate(true)}><Send size={15}/> Aplicar ajuste</button></div>}
      {session&&<button type="button" className="fc-plain-link" onClick={onConfigureApi}>Configurações da API</button>}
    </details>}
   </div>

 </aside>
}
function HelpDialog({close}:{close:()=>void}){return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-top"><h3>Como usar o AI Image Studio</h3><button onClick={close}><X size={20}/></button></div><p>Escreva livremente o que pretende criar, escolha o estilo e o formato e clique em <strong>Aprimorar meu prompt com IA</strong>. A NVIDIA transforma sua descrição em uma direção de arte detalhada, que você pode editar antes de clicar em <strong>Gerar minha imagem</strong>.</p><p>Para usar a IA no site público, entre por um link enviado ao seu e-mail. Nenhum token privado precisa ser informado.</p><p>Selecione os elementos para arrastar, redimensionar, girar e alterar as propriedades. Você também pode importar JSON, inserir imagens do computador e exportar PNG, WebP e JSON.</p><p>No modo Imagem profissional, a NVIDIA gera o hero visual com FLUX.1 Schnell e o editor compõe textos e chamadas editáveis. Se o endpoint não estiver disponível para sua conta, é possível usar uma foto enviada ou selecionar o modo vetorial.</p><div className="modal-links"><a href="https://build.nvidia.com/" target="_blank" rel="noreferrer">Obter chave NVIDIA <ArrowRight size={15}/></a><a href="https://github.com/Comfy-Org/ComfyUI" target="_blank" rel="noreferrer">ComfyUI <ArrowRight size={15}/></a></div><button className="generate-btn" onClick={close}>Entendi</button></div></div>}
function App(){
 const {design,setDesign,selectedId,undo,redo,undoStack,redoStack,loading}=useStudio();
 const layoutIssues=useMemo(()=>[...new Set([...analyzeLayout(design),...auditProfessionalDesign(design)])],[design]);
 const [zoom,setZoom]=useState(100);const [exportOpen,setExportOpen]=useState(false);const [help,setHelp]=useState(false);const [apiSettingsOpen,setApiSettingsOpen]=useState(false);const [authOpen,setAuthOpen]=useState(false);const [session,setSession]=useState<AuthSession|null>(null);const [focusMode,setFocusMode]=useState(false);const [inspectorOpen,setInspectorOpen]=useState(false);const [templatesExpanded,setTemplatesExpanded]=useState(false);const [moreOpen,setMoreOpen]=useState(false);
 const [theme,setTheme]=useState<'light'|'dark'>(()=>{
   try{const saved=localStorage.getItem('framecraft:theme');if(saved==='light'||saved==='dark')return saved}catch{/*private browser*/}
   return window.matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark';
 });const [mobilePanel,setMobilePanel]=useState<'prompt'|'layers'>('prompt');
 useEffect(()=>{let active=true;void auth.init().then(s=>{if(active)setSession(s)});const unsubscribe=auth.subscribe(s=>{if(active){setSession(s);if(s)setAuthOpen(false)}});return()=>{active=false;unsubscribe()}},[]);
 const exportRef=useRef<((mime?:'image/png'|'image/webp')=>void)|null>(null);
 const fileRef=useRef<HTMLInputElement>(null);
 const exportMenu=useRef<HTMLDivElement>(null);
 const moreMenu=useRef<HTMLDivElement>(null);
 useEffect(()=>{const fn=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey){if(!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement)){e.preventDefault();undo()}}if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();redo()}};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[undo,redo]);
 useEffect(()=>{
   document.documentElement.dataset.framecraftTheme=theme;
   try{localStorage.setItem('framecraft:theme',theme)}catch{/* unavailable */}
   return()=>{delete document.documentElement.dataset.framecraftTheme};
 },[theme]);
 useEffect(()=>{if(selectedId){setInspectorOpen(true);if(window.matchMedia('(max-width: 760px)').matches)setMobilePanel('layers')}},[selectedId]);
 useEffect(()=>{
   const close=(event:MouseEvent)=>{
     const target=event.target as Node;
     if(!exportMenu.current?.contains(target))setExportOpen(false);
     if(!moreMenu.current?.contains(target))setMoreOpen(false);
   };
   const esc=(event:KeyboardEvent)=>{if(event.key==='Escape'){setExportOpen(false);setMoreOpen(false)}};
   document.addEventListener('pointerdown',close);document.addEventListener('keydown',esc);
   return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',esc)}
 },[]);
 async function openFile(f:File|undefined){if(!f)return;try{setDesign(await readDesign(f))}catch(e){alert(e instanceof Error?e.message:'Arquivo inválido')}}
 return <div className={'app-shell theme-'+theme+' '+(focusMode?'focus-mode':'')}>
  <header className="topbar">
   <div className="brand"><span className="brand-icon"><Shapes size={17} strokeWidth={2}/></span><span className="brand-title">framecraft</span></div>
   <span className="fc-top-description">Estúdio de criação</span>
   <div className="header-actions">
    <button type="button" className="fc-icon-button fc-theme-action" onClick={()=>setTheme(v=>v==='dark'?'light':'dark')} title={theme==='dark'?'Ativar tema claro':'Ativar tema escuro'} aria-label={theme==='dark'?'Ativar tema claro':'Ativar tema escuro'}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>
    <button type="button" className="ghost-btn fc-auth-action" title={session?'Minha conta':'Entrar com e-mail'} onClick={()=>setAuthOpen(true)}><UserRound size={16}/><span>{session?'Conta':'Entrar'}</span></button>
    <input ref={fileRef} className="hidden" type="file" accept="application/json,.json" onChange={e=>{void openFile(e.target.files?.[0]);e.target.value=''}}/>
    <div className="export-wrapper" ref={exportMenu}><button type="button" className="top-export-btn" aria-expanded={exportOpen} aria-haspopup="menu" onClick={()=>{setExportOpen(v=>!v);setMoreOpen(false)}}><Download size={16}/> Exportar <ChevronDown size={15}/></button>
      {exportOpen&&<div className="export-menu" role="menu"><button role="menuitem" onClick={()=>{exportRef.current?.('image/png');setExportOpen(false)}}><FileImage size={16}/> PNG <span>Alta resolução</span></button><button role="menuitem" onClick={()=>{exportRef.current?.('image/webp');setExportOpen(false)}}><FileImage size={16}/> WebP</button><button role="menuitem" onClick={()=>{saveJSON(design);setExportOpen(false)}}><FileJson size={16}/> JSON editável</button></div>}
    </div>
    <div className="fc-more-wrapper" ref={moreMenu}><button type="button" className="fc-icon-button" title="Mais opções" aria-label="Mais opções" aria-expanded={moreOpen} onClick={()=>{setMoreOpen(v=>!v);setExportOpen(false)}}><Ellipsis size={19}/></button>
      {moreOpen&&<div className="fc-more-menu" role="menu">
       <button role="menuitem" onClick={()=>{fileRef.current?.click();setMoreOpen(false)}}><Upload size={16}/> Importar JSON</button>
       <button role="menuitem" onClick={()=>{setFocusMode(v=>!v);setMoreOpen(false)}}><Focus size={16}/> {focusMode?'Sair do modo foco':'Modo foco'}</button>
       <button role="menuitem" onClick={()=>{setApiSettingsOpen(true);setMoreOpen(false)}}><Settings2 size={16}/> Conexão da IA</button>
       <button role="menuitem" onClick={()=>{setHelp(true);setMoreOpen(false)}}><CircleHelp size={16}/> Ajuda</button>
      </div>}
    </div>
   </div>
  </header>
  <div className="mobile-tabs"><button className={mobilePanel==='prompt'?'active':''} onClick={()=>{setMobilePanel('prompt');setInspectorOpen(false)}}><Sparkles size={16}/> Criar</button><button className={mobilePanel==='layers'?'active':''} onClick={()=>{setMobilePanel('layers');setInspectorOpen(true)}}><Layers size={16}/> Editar</button></div>
  <div className={'workspace mobile-'+mobilePanel+(inspectorOpen?' inspector-open':'')}>
   <GeneratePanel onConfigureApi={()=>setApiSettingsOpen(true)} onSignIn={()=>setAuthOpen(true)} session={session}/>
   <main className="main-panel">
    <div className="main-header"><div className="fc-document-head"><h1 title={design.title}>{design.title}</h1><span>{design.canvas.width} × {design.canvas.height}px</span></div>
     <div className="fc-canvas-actions">
      <button type="button" className="fc-text-button" aria-expanded={templatesExpanded} onClick={()=>setTemplatesExpanded(v=>!v)}><LayoutTemplate size={15}/> Modelos</button>
      <button type="button" className="fc-text-button" title="Criar composição em branco" onClick={()=>{if(confirm('Criar uma arte em branco? As alterações atuais serão substituídas.'))setDesign({...structuredClone(qaHub),title:'Nova arte',elements:[],canvas:{...qaHub.canvas,background:'#FFFFFF',backgroundEnd:undefined}})}}><Plus size={15}/> Nova</button>
      <button type="button" className={'fc-text-button fc-editor-toggle'+(inspectorOpen?' active':'')} aria-expanded={inspectorOpen} onClick={()=>{setInspectorOpen(v=>!v);setMobilePanel('layers')}}>{inspectorOpen?<PanelRightClose size={16}/>:<PanelRightOpen size={16}/>} Editar</button>
     </div>
    </div>
    {templatesExpanded&&<div className="templates-strip"><div className="template-cards">{templateOptions.map(opt=><button key={opt.id} className="template-card" onClick={()=>{if(confirm('Substituir a composição atual por este modelo?')){setDesign(structuredClone(opt.doc));setTemplatesExpanded(false)}}}><span className={'template-swatch '+(opt.id==='qa'?'qa-swatch':'editorial-swatch')}>{opt.id==='qa'?'QA':'Aa'}</span><span>{opt.label}</span></button>)}<button className="template-card blank" onClick={()=>{setDesign({...structuredClone(qaHub),title:'Nova arte',elements:[],canvas:{...qaHub.canvas,background:'#FFFFFF',backgroundEnd:undefined}});setTemplatesExpanded(false)}}><Plus size={16}/> Em branco</button></div></div>}
    <div className="canvas-toolbar"><div className="toolbar-left"><button aria-label="Desfazer" title="Desfazer" disabled={!undoStack.length} onClick={undo}><Undo2 size={17}/></button><button aria-label="Refazer" title="Refazer" disabled={!redoStack.length} onClick={redo}><Redo2 size={17}/></button></div>
     <div className="toolbar-right"><button aria-label="Reduzir zoom" title="Reduzir zoom" onClick={()=>setZoom(z=>Math.max(60,z-10))}><Minus size={17}/></button><span className="zoom-value">{zoom}%</span><button aria-label="Ampliar zoom" title="Ampliar zoom" onClick={()=>setZoom(z=>Math.min(160,z+10))}><Plus size={17}/></button><button aria-label="Restaurar zoom" title="Ajustar ao painel" onClick={()=>setZoom(100)}><Maximize2 size={17}/></button></div>
    </div>
    <CanvasEditor exportRef={exportRef} zoom={zoom}/>
    {layoutIssues.length>0&&<div className="layout-quality" role="status"><span className="quality-attention">{layoutIssues.length} ponto(s) para revisar</span><details><summary>Verificar layout</summary><ul>{layoutIssues.slice(0,5).map((issue,i)=><li key={i}>{issue}</li>)}</ul></details></div>}
   </main>
   {inspectorOpen&&<Inspector onClose={()=>setInspectorOpen(false)}/>}
  </div>
  {help&&<HelpDialog close={()=>setHelp(false)}/>} 
  {apiSettingsOpen&&<ApiSettingsDialog onClose={()=>setApiSettingsOpen(false)}/>} 
  <AuthDialog open={authOpen} onClose={()=>setAuthOpen(false)} signedEmail={session?.user.email}/>
  {loading&&<div className="generation-toast"><span className="spinner"/> A NVIDIA está compondo sua imagem... <span className="muted">Não feche a página.</span></div>}
 </div>;
}
export default App;
