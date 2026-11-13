import {useEffect,useState} from 'react';
import type {FormEvent} from 'react';
import {createPortal} from 'react-dom';
import {ArrowRight,CheckCircle2,LockKeyhole,Mail,ShieldCheck,X} from 'lucide-react';
import {auth} from '../lib/auth';

type Props={open:boolean;onClose:()=>void;signedEmail?:string};
export function AuthDialog({open,onClose,signedEmail}:Props){
 const[email,setEmail]=useState('');
 const[sending,setSending]=useState(false);
 const[sent,setSent]=useState(false);
 const[error,setError]=useState('');
 useEffect(()=>{if(open){setError('');setSent(false)}},[open]);
 useEffect(()=>{
  if(!open)return;
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};
  document.addEventListener('keydown',key);
  return()=>document.removeEventListener('keydown',key);
 },[open,onClose]);
 if(!open)return null;
 async function sendMagicLink(e:FormEvent){
  e.preventDefault();setError('');setSending(true);
  try{await auth.sendLink(email);setSent(true)}
  catch(err){setError(err instanceof Error?err.message:'Não foi possível enviar o link de acesso.')}
  finally{setSending(false)}
 }
 async function logout(){await auth.signOut();onClose()}
 return createPortal(<div className="modal-backdrop" onMouseDown={onClose}>
  <section className="modal fc-api-modal" role="dialog" aria-modal="true" aria-labelledby="fc-auth-title" onMouseDown={e=>e.stopPropagation()}>
   <div className="modal-top"><div><span className="fc-modal-icon"><LockKeyhole size={20}/></span><h3 id="fc-auth-title">Acesso à criação com IA</h3></div><button aria-label="Fechar acesso" onClick={onClose}><X size={20}/></button></div>
   {signedEmail?<>
    <p>Você está conectado como <strong>{signedEmail}</strong>. A NVIDIA será utilizada através de sua sessão, sem chave de API no navegador.</p>
    <div className="fc-api-actions"><button className="fc-outline-btn" onClick={()=>void logout()}>Sair da conta</button><button className="fc-primary-btn" onClick={onClose}><CheckCircle2 size={16}/> Continuar</button></div>
   </>:sent?<>
    <div className="fc-auth-sent"><CheckCircle2 size={24}/><strong>Confira seu e-mail</strong><p>Enviamos um link para <b>{email}</b>. Abra-o para entrar no FrameCraft e retornar ao editor.</p></div>
    <button type="button" className="fc-outline-btn fc-wide" onClick={()=>setSent(false)}>Usar outro e-mail</button>
   </>:<>
    <p>Para proteger a cota da NVIDIA, entre com um link enviado ao seu e-mail. Não é necessário digitar nenhum token da NVIDIA ou do Supabase.</p>
    <form className="fc-auth-form" onSubmit={e=>void sendMagicLink(e)}>
     <label htmlFor="fc-login-email" className="fc-api-label"><Mail size={16}/> Seu e-mail</label>
     <input id="fc-login-email" className="fc-api-input" type="email" autoComplete="email" required autoFocus placeholder="voce@exemplo.com" value={email} onChange={e=>setEmail(e.target.value)} />
     {error&&<p className="fc-api-feedback fc-auth-error" role="alert">{error}</p>}
     <button className="fc-primary-btn fc-auth-submit" disabled={sending} type="submit">{sending?'Enviando...':'Receber link de acesso'} <ArrowRight size={16}/></button>
    </form>
    <div className="fc-api-note"><ShieldCheck size={17}/><span>A geração exige e-mail confirmado e tem limites de uso por usuário. Sua chave NVIDIA permanece protegida no Supabase.</span></div>
   </>}
  </section>
 </div>,document.body);
}
