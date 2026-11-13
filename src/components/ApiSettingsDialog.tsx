import {useEffect,useState} from 'react';
import {ArrowRight,CheckCircle2,Cloud,ExternalLink,Link2,ShieldCheck,X} from 'lucide-react';
import {apiUrl,getApiOrigin,normalizeApiOrigin,saveApiOrigin} from '../lib/apiConnection';

type Props = {onClose:()=>void};
export function ApiSettingsDialog({onClose}:Props){
  const [value,setValue]=useState(getApiOrigin);
  const [status,setStatus]=useState('');
  const [testing,setTesting]=useState(false);
  useEffect(()=>{
    const close=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};
    document.addEventListener('keydown',close);
    return()=>document.removeEventListener('keydown',close);
  },[onClose]);
  async function test(){
    setTesting(true);setStatus('');
    try{
      const origin=normalizeApiOrigin(value);
      if(!origin)throw new Error('Informe a URL pública do backend antes de testar.');
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);
      let response:Response;
      try{response=await fetch(apiUrl('health',origin),{signal:controller.signal,credentials:'omit'})}
      finally{clearTimeout(timer)}
      if(!response.ok)throw new Error(`A API respondeu HTTP ${response.status}.`);
      const json=await response.json() as {status?:string;configured?:boolean};
      if(json.status!=='ok')throw new Error('A resposta não corresponde à API FrameCraft.');
      setStatus(json.configured ? 'API conectada e NVIDIA configurada.' : 'API conectada, mas falta configurar a chave NVIDIA no servidor.');
    }catch(e){setStatus(e instanceof Error?e.message:'Não foi possível conectar à API. Confira o HTTPS e o CORS.')}
    finally{setTesting(false)}
  }
  function save(){
    try{saveApiOrigin(value);onClose()}catch(e){setStatus(e instanceof Error?e.message:'URL inválida')}
  }
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="modal fc-api-modal" role="dialog" aria-modal="true" aria-labelledby="api-modal-title" onMouseDown={e=>e.stopPropagation()}>
      <div className="modal-top"><div><span className="fc-modal-icon"><Cloud size={20}/></span><h3 id="api-modal-title">Conectar IA ao estúdio</h3></div><button aria-label="Fechar configurações" onClick={onClose}><X size={20}/></button></div>
      <p>O GitHub Pages publica o editor, mas não executa o servidor Node.js. Para gerar com NVIDIA, conecte uma API FrameCraft hospedada separadamente.</p>
      <label className="fc-api-label" htmlFor="fc-api-origin"><Link2 size={16}/> URL pública da API</label>
      <input className="fc-api-input" id="fc-api-origin" autoFocus spellCheck={false} inputMode="url" placeholder="https://minha-api.exemplo.com" value={value} onChange={e=>{setValue(e.target.value);setStatus('')}}/>
      <p className="fc-api-hint">Informe somente o endereço base, sem <code>/api</code>. Para uso local, deixe vazio (proxy do Vite) ou utilize <code>http://localhost:8787</code>.</p>
      {status&&<p className="fc-api-feedback" role="status">{status}</p>}
      <div className="fc-api-actions"><button className="fc-outline-btn" onClick={()=>void test()} disabled={testing}>{testing?'Verificando...':'Testar conexão'}</button><button className="fc-primary-btn" onClick={save}><CheckCircle2 size={16}/> Salvar conexão</button></div>
      <div className="fc-api-note"><ShieldCheck size={17}/><span>A chave NVIDIA permanece exclusivamente no backend. Aqui é armazenada apenas a URL da API neste navegador.</span></div>
      <a className="fc-api-doc-link" href="https://github.com/dev-oestagiario/FrameCraft#publicar-no-github-pages" target="_blank" rel="noopener noreferrer">Como publicar e conectar o backend <ExternalLink size={14}/><ArrowRight size={15}/></a>
    </section>
  </div>;
}
