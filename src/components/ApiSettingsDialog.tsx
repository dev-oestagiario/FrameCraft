import {useEffect,useState} from 'react';
import {ArrowRight,CheckCircle2,Cloud,ExternalLink,Link2,ShieldCheck,X} from 'lucide-react';
import {apiUrl,getApiOrigin,normalizeApiOrigin,saveApiOrigin} from '../lib/apiConnection';

type Props={onClose:()=>void};
export function ApiSettingsDialog({onClose}:Props){
 const[value,setValue]=useState(getApiOrigin);
 const[status,setStatus]=useState('');
 const[testing,setTesting]=useState(false);
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};
  document.addEventListener('keydown',key);
  return()=>document.removeEventListener('keydown',key);
 },[onClose]);
 async function test(){
  setStatus('');setTesting(true);
  try{
   const origin=normalizeApiOrigin(value);
   if(!origin)throw new Error('Informe o endereço HTTPS da API.');
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
   try{
    const response=await fetch(apiUrl('health',origin),{signal:controller.signal,credentials:'omit'});
    if(!response.ok)throw new Error('API respondeu HTTP '+response.status);
    const info=await response.json() as {status?:string;configured?:boolean};
    if(info.status!=='ok')throw new Error('A resposta não corresponde ao backend do FrameCraft.');
    setStatus(info.configured?'Backend HTTPS conectado. A NVIDIA está configurada.':'Backend HTTPS conectado; NVIDIA_API_KEY ainda não foi configurada.');
   }finally{clearTimeout(timer)}
  }catch(e){setStatus(e instanceof Error?e.message:'Falha na conexão HTTPS.')}
  finally{setTesting(false)}
 }
 function save(){
  try{saveApiOrigin(value);onClose()}catch(e){setStatus(e instanceof Error?e.message:'URL inválida')}
 }
 return <div className="modal-backdrop" onMouseDown={onClose}>
  <section className="modal fc-api-modal" role="dialog" aria-modal="true" aria-labelledby="fc-api-title" onMouseDown={e=>e.stopPropagation()}>
   <div className="modal-top"><div><span className="fc-modal-icon"><Cloud size={20}/></span><h3 id="fc-api-title">Conexão NVIDIA</h3></div><button aria-label="Fechar configurações" onClick={onClose}><X size={20}/></button></div>
   <p>O FrameCraft utiliza um backend HTTPS do Supabase e autenticação por e-mail. Não é necessário informar tokens privados nesta tela.</p>
   <label className="fc-api-label" htmlFor="fc-api-origin"><Link2 size={16}/> URL do backend HTTPS</label>
   <input className="fc-api-input" id="fc-api-origin" autoFocus spellCheck={false} inputMode="url" placeholder="https://seu-projeto.supabase.co/functions/v1/framecraft-api" value={value} onChange={e=>{setValue(e.target.value);setStatus('')}}/>
   <p className="fc-api-hint">O endereço do Supabase Dev é preenchido automaticamente. Apenas modifique se utilizar outro backend.</p>
   {status&&<p className="fc-api-feedback" role="status">{status}</p>}
   <div className="fc-api-actions"><button className="fc-outline-btn" onClick={()=>void test()} disabled={testing}>{testing?'Verificando...':'Testar conexão'}</button><button className="fc-primary-btn" onClick={save}><CheckCircle2 size={16}/> Salvar endereço</button></div>
   <div className="fc-api-note"><ShieldCheck size={17}/><span>O Supabase verifica a sessão do usuário e aplica limites de utilização. A chave NVIDIA permanece somente nos secrets.</span></div>
   <a className="fc-api-doc-link" href="https://github.com/dev-oestagiario/FrameCraft#publicar-no-github-pages" target="_blank" rel="noopener noreferrer">Documentação do projeto <ExternalLink size={14}/><ArrowRight size={15}/></a>
  </section>
 </div>;
}
