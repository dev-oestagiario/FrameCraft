import {useEffect,useState} from 'react';
import {ArrowRight,CheckCircle2,Cloud,ExternalLink,Link2,ShieldCheck,X} from 'lucide-react';
import {apiUrl,getApiOrigin,getAccessToken,normalizeApiOrigin,saveAccessToken,saveApiOrigin} from '../lib/apiConnection';

type Props = {onClose:()=>void};
export function ApiSettingsDialog({onClose}:Props){
  const [value,setValue]=useState(getApiOrigin);
  const [token,setToken]=useState(getAccessToken);
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
      const json=await response.json() as {status?:string;configured?:boolean;secured?:boolean};
      if(json.status!=='ok')throw new Error('A resposta não corresponde à API FrameCraft.');
      setStatus(!json.configured?'API HTTPS funcionando; configure a chave NVIDIA nos secrets do Supabase.':json.secured&&!token?'Backend pronto. Informe seu token privado para gerar.':'API HTTPS ativa. Salve e tente gerar para verificar suas credenciais.');
    }catch(e){setStatus(e instanceof Error?e.message:'Não foi possível conectar à API. Confira o HTTPS e o CORS.')}
    finally{setTesting(false)}
  }
  function save(){
    try{saveApiOrigin(value);saveAccessToken(token);onClose()}catch(e){setStatus(e instanceof Error?e.message:'URL inválida')}
  }
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="modal fc-api-modal" role="dialog" aria-modal="true" aria-labelledby="api-modal-title" onMouseDown={e=>e.stopPropagation()}>
      <div className="modal-top"><div><span className="fc-modal-icon"><Cloud size={20}/></span><h3 id="api-modal-title">Conectar IA ao estúdio</h3></div><button aria-label="Fechar configurações" onClick={onClose}><X size={20}/></button></div>
      <p>O FrameCraft usa uma função HTTPS do Supabase para conversar com a NVIDIA sem revelar a chave do modelo no navegador. A função precisa de um token privado para autorizar a geração.</p>
      <label className="fc-api-label" htmlFor="fc-api-origin"><Link2 size={16}/> URL pública da API</label>
      <input className="fc-api-input" id="fc-api-origin" autoFocus spellCheck={false} inputMode="url" placeholder="https://minha-api.exemplo.com" value={value} onChange={e=>{setValue(e.target.value);setStatus('')}}/>
      <p className="fc-api-hint">Use a URL completa <code>https://seu-projeto.supabase.co/functions/v1/framecraft-api</code>. Para o Vite local, você também pode deixar vazio.</p>
      <label className="fc-api-label" htmlFor="fc-api-token"><ShieldCheck size={16}/> Token privado de acesso</label>
      <input className="fc-api-input" id="fc-api-token" type="password" autoComplete="off" spellCheck={false} placeholder="Token FRAMECRAFT_ACCESS_TOKEN configurado no Supabase" value={token} onChange={e=>{setToken(e.target.value);setStatus('')}}/>
      <p className="fc-api-hint">O token de acesso fica apenas nesta sessão do navegador. Não é sua chave NVIDIA; a chave NVIDIA fica nos secrets da função.</p>
      {status&&<p className="fc-api-feedback" role="status">{status}</p>}
      <div className="fc-api-actions"><button className="fc-outline-btn" onClick={()=>void test()} disabled={testing}>{testing?'Verificando...':'Testar conexão'}</button><button className="fc-primary-btn" onClick={save}><CheckCircle2 size={16}/> Salvar conexão</button></div>
      <div className="fc-api-note"><ShieldCheck size={17}/><span>A chave NVIDIA permanece exclusivamente no backend. Aqui é armazenada apenas a URL da API neste navegador.</span></div>
      <a className="fc-api-doc-link" href="https://github.com/dev-oestagiario/FrameCraft#publicar-no-github-pages" target="_blank" rel="noopener noreferrer">Como publicar e conectar o backend <ExternalLink size={14}/><ArrowRight size={15}/></a>
    </section>
  </div>;
}
